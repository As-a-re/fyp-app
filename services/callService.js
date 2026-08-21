import RtcEngine from "react-native-agora";

class CallService {
  constructor() {
    this.engine = null;
    this.localUid = null;
    this.remoteUids = [];
    this.callActive = false;
  }

  // Initialize Agora RTC Engine
  async initializeEngine(agoraAppId) {
    try {
      this.engine = await RtcEngine.create(agoraAppId);

      // Enable video
      await this.engine.enableVideo();

      // Set up event listeners
      this.setupEventListeners();

      return this.engine;
    } catch (error) {
      console.error("Failed to initialize Agora engine:", error);
      throw error;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.engine) return;

    // When a user joins
    this.engine.addListener("UserJoined", (uid, elapsed) => {
      console.log("User joined:", uid);
      if (!this.remoteUids.includes(uid)) {
        this.remoteUids.push(uid);
      }
    });

    // When a user leaves
    this.engine.addListener("UserOffline", (uid, reason) => {
      console.log("User left:", uid);
      this.remoteUids = this.remoteUids.filter((id) => id !== uid);
    });

    // Connection state changed
    this.engine.addListener("ConnectionStateChanged", (state, reason) => {
      console.log("Connection state changed:", state, reason);
    });

    // Error handling
    this.engine.addListener("Error", (error) => {
      console.error("Agora error:", error);
    });
  }

  // Join a call
  async joinCall(token, channelName, uid = 0) {
    try {
      if (!this.engine) {
        throw new Error("Engine not initialized");
      }

      this.localUid = uid;

      await this.engine.joinChannel(token, channelName, "", uid);
      this.callActive = true;

      console.log("Joined channel:", channelName);
      return uid;
    } catch (error) {
      console.error("Failed to join call:", error);
      throw error;
    }
  }

  // Leave the call
  async leaveCall() {
    try {
      if (!this.engine) return;

      await this.engine.leaveChannel();
      this.callActive = false;
      this.remoteUids = [];
      this.localUid = null;

      console.log("Left channel");
    } catch (error) {
      console.error("Failed to leave call:", error);
      throw error;
    }
  }

  // Mute audio
  async muteAudio(mute = true) {
    try {
      if (!this.engine) return;
      await this.engine.muteLocalAudioStream(mute);
    } catch (error) {
      console.error("Failed to mute audio:", error);
      throw error;
    }
  }

  // Mute video
  async muteVideo(mute = true) {
    try {
      if (!this.engine) return;
      await this.engine.muteLocalVideoStream(mute);
    } catch (error) {
      console.error("Failed to mute video:", error);
      throw error;
    }
  }

  // Switch camera
  async switchCamera() {
    try {
      if (!this.engine) return;
      await this.engine.switchCamera();
    } catch (error) {
      console.error("Failed to switch camera:", error);
      throw error;
    }
  }

  // Enable speaker phone
  async enableSpeaker(enabled = true) {
    try {
      if (!this.engine) return;
      await this.engine.setEnableSpeakerphone(enabled);
    } catch (error) {
      console.error("Failed to enable speaker:", error);
      throw error;
    }
  }

  // Destroy engine
  async destroy() {
    try {
      if (this.callActive) {
        await this.leaveCall();
      }
      if (this.engine) {
        await this.engine.destroy();
        this.engine = null;
      }
    } catch (error) {
      console.error("Failed to destroy engine:", error);
      throw error;
    }
  }

  // Get remote users
  getRemoteUids() {
    return this.remoteUids;
  }

  // Check if call is active
  isCallActive() {
    return this.callActive;
  }
}

export const callService = new CallService();
export default callService;
