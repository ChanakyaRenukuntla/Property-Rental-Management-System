const https = require('https');
const fs = require('fs');

const code = `---
title: Fig 3.1 Three-tier architecture showing client, application, and data layers of the system
---
graph TD
    %% Define Styles
    classDef client fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef app fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef data fill:#fff3e0,stroke:#f57c00,stroke-width:2px;
    classDef external fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;

    %% Client Layer
    subgraph ClientLayer ["1. Presentation Layer (React.js Frontend)"]
        UI[User Interface - Browser]
        Pages[React Pages]
        State[State Management / Hooks]
        APICalls[Axios / HTTP Client]
    end

    %% Application Layer
    subgraph AppLayer ["2. Application Layer (Node.js & Express Backend)"]
        Router[Express Routing]
        Auth[Auth Middleware]
        Controllers[Controllers]
        Models[Mongoose Models]
    end

    %% Data Layer
    subgraph DataLayer ["3. Data Layer (MongoDB Database)"]
        MongoDB[(MongoDB)]
        Collections[Collections]
    end

    %% External APIs
    subgraph External ["External Services"]
        OSM[OpenStreetMap / Overpass API]
    end

    %% Connections
    UI --> Pages
    Pages --> State
    State --> APICalls
    APICalls -- "HTTP / REST APIs" --> Router
    
    Pages -.-> OSM
    
    Router --> Auth
    Auth --> Controllers
    Controllers --> Models
    
    Models -- "Mongoose (TCP/IP)" --> MongoDB
    MongoDB --> Collections

    %% Apply Styles
    class ClientLayer,UI,Pages,State,APICalls client;
    class AppLayer,Router,Auth,Controllers,Models app;
    class DataLayer,MongoDB,Collections data;
    class External,OSM external;
`;

const state = { code: code, mermaid: { theme: 'default' } };
const json = JSON.stringify(state);
const base64 = Buffer.from(json).toString('base64');
const url = `https://mermaid.ink/img/${base64}?type=png`;

console.log('Downloading from:', url);

https.get(url, (res) => {
    if (res.statusCode !== 200) {
        console.error('Failed to download image. Status:', res.statusCode);
        return;
    }
    const file = fs.createWriteStream("Fig_3.1_Architecture.png");
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('Successfully saved to Fig_3.1_Architecture.png');
    });
}).on('error', (err) => {
    console.error('Error downloading:', err.message);
});
