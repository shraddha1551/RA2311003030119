export const Log = async (stack, level, packageName, message) => {
  try {
    await fetch("http://localhost:3001/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message,
      }),
    });
  } catch {
    // Logging must not block the user interface.
  }
};
