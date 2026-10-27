/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, Menu, protocol } = require("electron");
const fs = require("fs");
const path = require("path");

const APP_NAME = "Hardware Patriots";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.setName(APP_NAME);

  app.on("second-instance", () => {
    const windows = BrowserWindow.getAllWindows();
    const window = windows[0];
    if (!window) return;
    if (window.isMinimized()) window.restore();
    window.focus();
  });

  function createWindow() {
    const window = new BrowserWindow({
      width: 1180,
      height: 860,
      minWidth: 380,
      minHeight: 640,
      title: APP_NAME,
      backgroundColor: "#ffffff",
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    window.loadURL("app://shelf/index.html");
    return window;
  }

  app.whenReady().then(() => {
    const root = path.join(app.getAppPath(), "out");

    protocol.handle("app", (request) => {
      let pathname = decodeURIComponent(new URL(request.url).pathname);
      if (pathname.endsWith("/")) pathname += "index.html";
      const filePath = path.resolve(root, `.${pathname}`);
      const relative = path.relative(root, filePath);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return new Response("Not found", { status: 404 });
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return new Response("Not found", { status: 404 });
      }
      const body = fs.readFileSync(filePath);
      const type = types[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
      return new Response(body, { headers: { "content-type": type } });
    });

    const menu = [
      {
        label: "File",
        submenu: [{ role: "quit" }],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" },
        ],
      },
    ];

    if (process.platform === "darwin") {
      menu.unshift({
        label: APP_NAME,
        submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
      });
    }

    menu.push({
      label: "Help",
      submenu: [
        {
          label: `Version ${app.getVersion()}`,
          click: () => {
            const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
            dialog.showMessageBox(window, {
              type: "info",
              title: APP_NAME,
              message: APP_NAME,
              detail: `Version ${app.getVersion()}\n\nAdd a spool with its brand, type, color, best use, printer, and filament storage. Brands you add stay on this computer. A spool under 20% is marked low. The shelf is saved on this computer.`,
              buttons: ["OK"],
              noLink: true,
            });
          },
        },
      ],
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
