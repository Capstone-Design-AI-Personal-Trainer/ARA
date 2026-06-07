let activeCalibration = null;

export function setActiveCalibration(calibration) {
  activeCalibration = calibration;
}

export function getActiveCalibration() {
  return activeCalibration;
}

export function clearActiveCalibration() {
  activeCalibration = null;
}
