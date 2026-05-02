const http = require('http');
const { Log } = require('../logging_middleware');

let notifications = [
  {
    id: 1,
    message: "Welcome notification",
    type: "Event",
    read: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    message: "Another notification",
    type: "Result",
    read: false,
    timestamp: new Date().toISOString(),
  },
];


const sendJson = (res, statusCode, data) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
};

const parseBody = (req, callback) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });
  req.on('end', () => {
    try {
      callback(null, JSON.parse(body || '{}'));
    } catch (err) {
      callback(err);
    }
  });
};

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
  res.writeHead(204);
  res.end();
  return;
}
  const requestUrl = new URL(req.url, "http://localhost:3001");

  if (req.method === 'GET' && requestUrl.pathname === '/notifications') {
    const page = Math.max(parseInt(requestUrl.searchParams.get("page") || "1", 10), 1);
    const limit = Math.max(parseInt(requestUrl.searchParams.get("limit") || "10", 10), 1);
    const notificationType = requestUrl.searchParams.get("notification_type");

    let filteredNotifications = notifications;

    if (notificationType && notificationType !== "All") {
      filteredNotifications = notifications.filter(
        notification => notification.type === notificationType
      );
    }

    const total = filteredNotifications.length;
    const startIndex = (page - 1) * limit;
    const paginatedNotifications = filteredNotifications.slice(
      startIndex,
      startIndex + limit
    );

    Log("backend", "info", "route", `fetch notifications page ${page} limit ${limit}`);

    return sendJson(res, 200, {
      notifications: paginatedNotifications,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  }

  if (req.method === 'POST' && req.url === '/notifications/read') {
    return parseBody(req, (err, body) => {
      if (err) {
        Log("backend", "error", "handler", "invalid JSON while marking notification as read");
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }

      const notification = notifications.find(n => n.id === body.id);
      if (!notification) {
        Log("backend", "warn", "service", `notification ${body.id} not found for read update`);
        return sendJson(res, 404, { error: 'Notification not found' });
      }
      notification.read = true;
      Log("backend", "info", "service", `notification ${body.id} marked as read`);
      return sendJson(res, 200, { message: 'Notification marked as read' });
    });
  }

  if (req.method === 'POST' && req.url === '/notifications') {
    return parseBody(req, (err, body) => {
      if (err) {
        Log("backend", "error", "handler", "invalid JSON while creating notification");
        return sendJson(res, 400, { error: 'Invalid JSON' });
      }

      const newNotification = {
        id: notifications.length + 1,
        message: body.message || 'New notification',
        type: body.type || "Event",
        read: false,
        timestamp: new Date().toISOString(),
      };
      notifications.push(newNotification);
      Log("backend", "info", "service", `created ${newNotification.type} notification`);
      return sendJson(res, 201, newNotification);
    });
  }

  if (req.method === 'POST' && req.url === '/logs') {
    return parseBody(req, async (err, body) => {
      if (err) return sendJson(res, 400, { error: 'Invalid JSON' });

      await Log(
        body.stack || "frontend",
        body.level || "info",
        body.package || "api",
        body.message || "frontend activity"
      );

      return sendJson(res, 200, { message: 'Log processed' });
    });
  }

  Log("backend", "warn", "route", `${req.method} ${req.url} not found`);
  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
