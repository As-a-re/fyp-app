// Web stub implementation of CallService
// Agora RTC is a native-only library and cannot be used on web
// This stub provides no-op implementations to prevent bundling errors

class CallService {
  constructor() {
    this.engine = null;
    this.localUid = null;
    this.remoteUids = [];
    this.callActive = false;

    console.warn(
      "CallService: Running on web. Agora RTC calls are not supported on web.",
    );
  }

  async initializeEngine(_agoraAppId) {
    console.warn("CallService: initializeEngine() is not supported on web.");
    return null;
  }

  setupEventListeners() {
    console.warn("CallService: setupEventListeners() is not supported on web.");
  }

  async joinCall(_token, _channelName, uid = 0) {
    console.warn("CallService: joinCall() is not supported on web.");
    this.localUid = uid;
    this.callActive = true;
    return uid;
  }

  async leaveCall() {
    console.warn("CallService: leaveCall() is not supported on web.");
    this.callActive = false;
    this.remoteUids = [];
    this.localUid = null;
  }

  async muteAudio(_mute = true) {
    console.warn("CallService: muteAudio() is not supported on web.");
  }

  async muteVideo(_mute = true) {
    console.warn("CallService: muteVideo() is not supported on web.");
  }

  async switchCamera() {
    console.warn("CallService: switchCamera() is not supported on web.");
  }

  async enableSpeaker(_enabled = true) {
    console.warn("CallService: enableSpeaker() is not supported on web.");
  }

  async destroy() {
    console.warn("CallService: destroy() is not supported on web.");
    this.engine = null;
  }

  getRemoteUids() {
    return this.remoteUids;
  }

  isCallActive() {
    return this.callActive;
  }
}

export const callService = new CallService();
export default callService;
