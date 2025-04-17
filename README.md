# URLLC-Topologies
some URLLC Topologies made with mermaid in order to be implemented in Free5GC

<br><br><br>

# 1- URLLC for for vehicle-to-vehicle accident avoidance

```mermaid
flowchart TB
  %% Radio Domain
  subgraph "Radio Domain"
    direction TB
    V1[Vehicle A]
    V2[Vehicle B]
    gNB["gNB (NG‑RAN)"]
    V1 -- "PC5 Sidelink (URLLC)" --> V2
    V1 -- "Uu Interface (N2/N3)" --> gNB
    V2 -- "Uu Interface (N2/N3)" --> gNB
  end

  %% Edge Cloud
  subgraph "Edge Cloud (MEC)"
    MEC[MEC Server]
    UPF[UPF]
    gNB -- "N3" --> UPF
    UPF -- "N6 (MEC API)" --> MEC
  end

  %% 5G Core Network
  subgraph "5G Core Network (free5GC SBA)"
    direction TB
    AMF[AMF]
    SMF[SMF]
    UPF[UPF]
    NRF[NRF]
    AUSF[AUSF]
    UDM[UDM]
    UDR[UDR]
    PCF[PCF]
    NEF[NEF]
    NSSF[NSSF]

    gNB -- "N2" --> AMF
    AMF -- "N11" --> SMF
    SMF -- "N4 (PFCP)" --> UPF
    AMF -- "SvcReg" --> NRF
    SMF -- "SvcReg" --> NRF
    AMF -- "N12" --> AUSF
    AUSF -- "N8" --> UDR
    UDM -- "N10" --> UDR
    PCF -- "N7" --> SMF
    NEF -- "N33" --> PCF
    AMF -- "N22" --> NSSF
  end

```


# 2- URLLC for for autonomous machinery within factories and warehouses

```mermaid
flowchart TB
  subgraph "Radio Access Network (RAN)"
    direction TB
    AGV1[AGV 1]
    AGV2[AGV 2]
    Robot1[Robot Arm 1]
    Robot2[Robot Arm 2]
    Sensor1[Sensor Node 1]
    Sensor2[Sensor Node 2]
    DU["Distributed Unit (DU)"]
    CU["Central Unit (CU)"]
    RU1["Radio Unit (RU) 1"]
    RU2["Radio Unit (RU) 2"]

    AGV1 -- "5G NR (URLLC)" --> RU1
    AGV2 -- "5G NR (URLLC)" --> RU2
    Robot1 -- "5G NR (URLLC)" --> RU1
    Robot2 -- "5G NR (URLLC)" --> RU2
    Sensor1 -- "5G NR (URLLC)" --> RU1
    Sensor2 -- "5G NR (URLLC)" --> RU2
    RU1 -- "Fronthaul" --> DU
    RU2 -- "Fronthaul" --> DU
    DU -- "Midhaul" --> CU
  end

  subgraph "Edge Computing"
    direction TB
    MEC[MEC Server]
    CU -- "Backhaul" --> MEC
  end

  subgraph "5G Core Network (free5GC)"
    direction TB
    AMF["Access and Mobility Management Function (AMF)"]
    SMF["Session Management Function (SMF)"]
    UPF["User Plane Function (UPF)"]
    NRF["Network Repository Function (NRF)"]
    AUSF["Authentication Server Function (AUSF)"]
    UDM["Unified Data Management (UDM)"]
    PCF["Policy Control Function (PCF)"]
    NSSF["Network Slice Selection Function (NSSF)"]

    MEC -- "N3 Interface" --> UPF
    CU -- "N2 Interface" --> AMF
    AMF -- "N11 Interface" --> SMF
    SMF -- "N4 Interface" --> UPF
    AMF -- "N12 Interface" --> AUSF
    AUSF -- "N8 Interface" --> UDM
    SMF -- "N7 Interface" --> PCF
    AMF -- "N22 Interface" --> NSSF
    AMF -- "Service Discovery" --> NRF
    SMF -- "Service Discovery" --> NRF
  end
```

