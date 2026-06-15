"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_serve_1 = __importDefault(require("electron-serve"));
const electron_prompt_1 = __importDefault(require("electron-prompt"));
const dgram = __importStar(require("dgram"));
const os = __importStar(require("os"));
const electron_updater_1 = require("electron-updater");
const DISCOVERY_PORT = 12345;
const DISCOVERY_MESSAGE = Buffer.from("DISCOVER_SERVER");
const computerName = os.hostname();
const client4 = dgram.createSocket("udp4");
client4.bind(() => {
    client4.setBroadcast(true);
});
const client6 = dgram.createSocket("udp6");
client6.bind(() => { });
var foundServer = false;
var showAlertUDP = false;
const sendDiscoveryMessages = () => {
    if (foundServer)
        return;
    client4.send(DISCOVERY_MESSAGE, DISCOVERY_PORT, "255.255.255.255", (err) => {
        if (err)
            console.error("IPv4 error:", err);
        else
            console.log("IPv4 discovery message sent");
    });
    client6.send(DISCOVERY_MESSAGE, DISCOVERY_PORT, "ff02::1", (err) => {
        if (err)
            console.error("IPv6 error:", err);
        else
            console.log("IPv6 discovery message sent");
    });
};
const loadURL = (0, electron_serve_1.default)({ directory: "out" });
var API_URL = "";
(async () => {
    await electron_1.app.whenReady();
    const mainWindow = new electron_1.BrowserWindow();
    mainWindow.maximize();
    var interval = setInterval(sendDiscoveryMessages, 5000);
    sendDiscoveryMessages();
    function startDiscovery() {
        clearInterval(interval);
        foundServer = false;
        sendDiscoveryMessages();
        interval = setInterval(sendDiscoveryMessages, 5000);
    }
    async function setLocalStorage(key, value) {
        await mainWindow.webContents.executeJavaScript(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)})`);
    }
    async function getLocalStorage(key) {
        return await mainWindow.webContents.executeJavaScript(`localStorage.getItem(${JSON.stringify(key)})`);
    }
    mainWindow.webContents.once("did-finish-load", async () => {
        await setLocalStorage("computerName", computerName);
        electron_updater_1.autoUpdater.on("update-available", () => {
            new electron_1.Notification({
                title: "Blossom Voting Client",
                body: "Downloading update...",
            }).show();
        });
        electron_updater_1.autoUpdater.on("update-downloaded", () => {
            new electron_1.Notification({
                title: "Blossom Voting Client",
                body: "Update downloaded. Restarting in 30 seconds.",
            }).show();
            setTimeout(() => {
                electron_updater_1.autoUpdater.quitAndInstall();
            }, 30_000);
        });
        electron_updater_1.autoUpdater.on("checking-for-update", () => {
            mainWindow.webContents.executeJavaScript(`console.log("[Updater] Checking for updates...")`);
        });
        electron_updater_1.autoUpdater.on("update-available", (info) => {
            mainWindow.webContents.executeJavaScript(`console.log("[Updater] Update available: ${info.version}")`);
        });
        electron_updater_1.autoUpdater.on("update-not-available", () => {
            mainWindow.webContents.executeJavaScript(`console.log("[Updater] No updates available")`);
        });
        electron_updater_1.autoUpdater.on("download-progress", (progress) => {
            mainWindow.webContents.executeJavaScript(`console.log("[Updater] Download: ${progress.percent.toFixed(1)}%")`);
        });
        electron_updater_1.autoUpdater.on("update-downloaded", () => {
            mainWindow.webContents.executeJavaScript(`console.log("[Updater] Update downloaded")`);
        });
        electron_updater_1.autoUpdater.on("error", (err) => {
            mainWindow.webContents.executeJavaScript(`console.error("[Updater]", ${JSON.stringify(err.message)})`);
        });
        electron_updater_1.autoUpdater.checkForUpdates().catch(console.error);
        setInterval(() => {
            electron_updater_1.autoUpdater.checkForUpdates().catch(console.error);
        }, 1000 * 60 * 30);
    });
    client4.on("message", async (msg, rinfo) => {
        if (msg.toString().startsWith("SERVER_HERE")) {
            if (foundServer)
                return;
            console.log(`ipv4 Found server at ${rinfo.address}:${msg.toString().split(":")[1]}`);
            foundServer = true;
            clearInterval(interval);
            const apiURL = `http://${rinfo.address}:${msg.toString().split(":")[1]}`;
            await setLocalStorage("API_URL", apiURL);
            mainWindow.reload();
            if (showAlertUDP) {
                showAlertUDP = false;
                mainWindow.webContents.executeJavaScript(`alert('API RECEIVED: ${apiURL}')`);
            }
        }
    });
    client6.on("message", async (msg, rinfo) => {
        if (msg.toString().startsWith("SERVER_HERE")) {
            if (foundServer)
                return;
            console.log(`ipv6 Found server at ${rinfo.address.split("%")[0]}:${msg.toString().split(":")[1]}`);
            foundServer = true;
            clearInterval(interval);
            const apiURL = `http://[${rinfo.address.split("%")[0]}]:${msg.toString().split(":")[1]}`;
            await setLocalStorage("API_URL", apiURL);
            mainWindow.reload();
            if (showAlertUDP) {
                showAlertUDP = false;
                mainWindow.webContents.executeJavaScript(`alert('API RECEIVED: ${apiURL}')`);
            }
        }
    });
    electron_1.globalShortcut.register("CommandOrControl+U", () => {
        mainWindow.close();
    });
    electron_1.globalShortcut.register("CommandOrControl+Shift+R", () => {
        mainWindow.reload();
    });
    electron_1.globalShortcut.register("CommandOrControl+Shift+D", () => {
        mainWindow.webContents.openDevTools();
    });
    electron_1.globalShortcut.register("CommandOrControl+Shift+P", async () => {
        const apiURL = await (0, electron_prompt_1.default)({
            title: "API",
            label: "Enter API:",
            value: await getLocalStorage("API_URL"),
            inputAttrs: {
                type: "url",
                required: "true",
            },
        });
        if (apiURL) {
            console.log(apiURL);
            await setLocalStorage("API_URL", apiURL || "");
        }
    });
    electron_1.globalShortcut.register("CommandOrControl+Shift+U", () => {
        startDiscovery();
        showAlertUDP = true;
    });
    // The above is equivalent to this:
    await mainWindow.loadURL("app://-");
    // The `-` is just the required hostname.
})();
