export const WS_URL: string =
    (import.meta as any).env?.VITE_WS_URL ??
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8080`;

export const HTTP_URL: string = WS_URL.replace(/^ws/, "http"); // ws->http, wss->https
