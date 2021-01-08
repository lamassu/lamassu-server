module.exports = function () {
  return {
    oldVersionId: "unset",
    settingsCache: {},
    canLogClockSkewMap: {},
    canGetLastSeenMap: {},
    pids: {},
    reboots: {},
    shutdowns: {},
    restartServicesMap: {}
  }
}()