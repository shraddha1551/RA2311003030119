import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { Log } from "./logger";

function App() {
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Event");
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: view === "priority" ? "100" : String(limit),
        page: view === "priority" ? "1" : String(page),
      });

      if (filter !== "All") {
        params.append("notification_type", filter);
      }

      const response = await fetch(
        `http://localhost:3001/notifications?${params.toString()}`
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
      setTotalPages(data.totalPages || 1);
      setTotalNotifications(data.total || 0);
      Log("frontend", "info", "api", "notifications fetched successfully");
    } catch (error) {
      Log("frontend", "error", "api", "failed to fetch notifications");
    }
  }, [filter, limit, page, view]);

  const createNotification = async () => {
    if (!message.trim()) return;

    await fetch("http://localhost:3001/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, type }),
    });

    setMessage("");
    Log("frontend", "info", "component", `created ${type} notification`);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    await fetch("http://localhost:3001/notifications/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    Log("frontend", "info", "component", `marked notification ${id} as read`);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const priorityWeight = {
    Placement: 3,
    Result: 2,
    Event: 1,
  };

  let visibleNotifications = [...notifications];

  if (view === "priority") {
    visibleNotifications = visibleNotifications
      .filter((notification) => !notification.read)
      .sort((a, b) => {
        const weightDiff = priorityWeight[b.type] - priorityWeight[a.type];

        if (weightDiff !== 0) {
          return weightDiff;
        }

        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, 10);
  }

  return (
    <div className="app">
      <h1>Campus Notifications</h1>

      <div className="form">
        <input
          type="text"
          placeholder="Enter notification message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="Event">Event</option>
          <option value="Result">Result</option>
          <option value="Placement">Placement</option>
        </select>
        <button onClick={createNotification}>Add Notification</button>
      </div>

      <div>
        <button onClick={() => { setView("all"); setPage(1); }}>All Notifications</button>
        <button onClick={() => { setView("priority"); setPage(1); }}>Priority Inbox</button>
      </div>

      <div>
        <button onClick={() => { setFilter("All"); setPage(1); }}>All</button>
        <button onClick={() => { setFilter("Placement"); setPage(1); }}>Placement</button>
        <button onClick={() => { setFilter("Result"); setPage(1); }}>Result</button>
        <button onClick={() => { setFilter("Event"); setPage(1); }}>Event</button>
      </div>

      <p className="summary">
        Showing {visibleNotifications.length} of {totalNotifications} notifications
      </p>

      <div className="notifications">
        {visibleNotifications.length === 0 ? (
          <p>No notifications found.</p>
        ) : (
          visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification ${
                notification.read ? "read" : "unread"
              }`}
            >
              <p>{notification.message}</p>
              <p>Type: {notification.type}</p>
              <span>{notification.read ? "Read" : "Unread"}</span>

              {!notification.read && (
                <button onClick={() => markAsRead(notification.id)}>
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {view === "all" && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
