# V2X (Vehicle-to-Everything)

3GPP defines a 5G-V2X architecture in which vehicles (UEs) connect via NG-RAN (gNBs) to the 5G Core (including the UPF).  In a **single-cell** topology, multiple V2X UEs (e.g. vehicles) attach to the same gNB, which then forwards traffic to a UPF in the core.  In a **multi-cell** setup, vehicles in different cells connect to their respective gNBs, which share a common core (UPF) for routing V2X data. These topologies correspond to the 3GPP non-roaming V2X reference architecture.

* *Variation 1 – Single gNB:* All V2X UEs attach to one gNB, which connects to a UPF.

  ```mermaid
  graph LR
    UE1 --> gNB
    UE2 --> gNB
    UE3 --> gNB
    gNB --> UPF
  ```
* *Variation 2 – Multi gNB:* V2X UEs attach to different gNBs; each gNB connects to the same UPF in the core.

  ```mermaid
  graph LR
    UE1 --> gNB1
    UE2 --> gNB2
    UE3 --> gNB3
    gNB1 --> UPF
    gNB2 --> UPF
    gNB3 --> UPF
  ```

  These illustrate how V2X UEs in one or multiple cells are handled by gNB(s) and the UPF (data network).

# Industrial Automation

Industrial URLLC often uses *local private 5G networks* on factory premises. In this case each gNB connects to an on-site 5G core (UPF). A common **star topology** has many industrial UEs (sensors, robots, controllers) attaching to a single factory gNB, which forwards data to a UPF. More advanced URLLC setups use **path-diverse** connectivity: for example an automated guided vehicle (AGV) may be simultaneously served by multiple gNBs. In one illustrative scenario, an AGV (“UE”) is connected via redundant links to two or more synchronized gNBs, each of which then connects into the same UPF. This multi-gNB (CoMP) topology increases reliability by sending duplicate data streams over multiple paths.

* *Variation 1 – Single gNB:* All factory devices connect to one gNB, which connects to the local UPF.

  ```mermaid
  graph LR
    Sensor1 --> gNB
    Sensor2 --> gNB
    Sensor3 --> gNB
    gNB --> UPF
  ```
* *Variation 2 – Multi gNB (Path Diversity):* A critical UE (e.g. AGV) connects to several gNBs; each gNB connects to the UPF.

  ```mermaid
  graph LR
    AGV --> gNB1
    AGV --> gNB2
    gNB1 --> UPF
    gNB2 --> UPF
  ```

  Here the AGV (“UE”) is served by two base stations (gNB1, gNB2) for extra reliability, as described in industrial URLLC deployments.

# Healthcare

5G URLLC in healthcare may involve hospitals, patient devices, and emergency vehicles.  In a **hospital-based private network**, UEs (medical sensors, monitors, AR/VR surgical tools, etc.) connect to local gNBs which link to the core UPF.  For example, a smart-healthcare architecture shows UEs in a hospital attaching to small and macro gNBs, which then reach the 5G core.  One topology uses a single macro gNB per facility; another uses a two-tier cell structure (small-cell gNBs connecting into a macro gNB to reach the core).

* *Variation 1 – Single-tier (Macro only):* All medical UEs connect to one macro gNB in the hospital, which connects to the UPF.

  ```mermaid
  graph LR
    Device1 --> gNB
    Device2 --> gNB
    Device3 --> gNB
    gNB --> UPF
  ```
* *Variation 2 – Two-tier (Macro + Small cell):* UEs connect to a small-cell gNB, which backhauls via a macro gNB to the UPF.

  ```mermaid
  graph LR
    Device1 --> SBS
    Device2 --> SBS
    SBS --> MBS
    MBS --> UPF
  ```

  These reflect architectures where hospital devices connect through small and macro cells into the core network.

# AR/VR

Augmented/Virtual Reality headsets and devices are also URLLC UEs in private 5G networks (e.g. for real-time telepresence or remote control).  Like other domains, AR/VR UEs attach to gNBs that route traffic through the UPF.  For instance, multiple AR/VR headsets in a training room may share a single gNB (star topology), or a moving headset may be served by two gNBs during a handover to prevent interruptions.  (AR/VR is identified as a URLLC use case for low-latency immersive video.)

* *Variation 1 – Single gNB:* All AR/VR UEs connect to one gNB, which connects to the UPF.

  ```mermaid
  graph LR
    Headset1 --> gNB
    Headset2 --> gNB
    Headset3 --> gNB
    gNB --> UPF
  ```
* *Variation 2 – Multi gNB:* A mobile AR/VR UE connects simultaneously to two gNBs (for redundancy or seamless coverage), each linking to the UPF.

  ```mermaid
  graph LR
    Headset --> gNB1
    Headset --> gNB2
    gNB1 --> UPF
    gNB2 --> UPF
  ```

  These illustrate typical AR/VR setups on a private 5G network (often combined with edge compute), where UEs connect through one or multiple base stations to the core.

# Smart Grid

Smart grid deployments use private 5G to connect power grid devices (meters, sensors, controllers) with low latency. UEs like substation controllers attach to gNBs that forward data to the UPF/core.  For example, private 5G enables real-time coordination between substations and control centers.

* *Variation 1 – Single gNB:* Multiple grid sensors (UEs) connect to one gNB at a substation, which connects to the UPF.

  ```mermaid
  graph LR
    SensorA --> gNB
    SensorB --> gNB
    gNB --> UPF
  ```
* *Variation 2 – Multi gNB:* Different substations each have their own gNB, all connected to a central UPF.

  ```mermaid
  graph LR
    Sensor1 --> gNB1
    Sensor2 --> gNB2
    gNB1 --> UPF
    gNB2 --> UPF
  ```
