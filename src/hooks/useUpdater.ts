import { useState, useEffect } from 'react';
import { updateService } from '../updateService';
import { UpdateState } from '../types';

export function useUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState>(updateService.getState());

  useEffect(() => {
    const unsubscribe = updateService.subscribe((state) => {
      setUpdateState(state);
    });
    return () => unsubscribe();
  }, []);

  const checkForUpdates = async () => {
    return await updateService.checkForUpdates(false);
  };

  const downloadAndInstall = async () => {
    return await updateService.downloadAndInstallUpdate();
  };

  const restartAndInstall = async () => {
    return await updateService.relaunchApp();
  };

  const dismissModal = () => {
    updateService.dismissStartupModal();
  };

  const clearLogs = () => {
    updateService.clearLogs();
  };

  const getDiagnosticReport = () => {
    return updateService.getDiagnosticReport();
  };

  return {
    currentVersion: updateState.currentVersion,
    latestVersion: updateState.latestRelease?.version || null,
    updateAvailable: updateState.status === 'update_available',
    checking: updateState.status === 'checking',
    downloading: updateState.status === 'downloading',
    downloadProgress: updateState.downloadProgress,
    readyToInstall: updateState.status === 'ready_to_install',
    error: updateState.errorMessage,
    isMandatory: updateState.latestRelease?.isMandatory || false,
    changelog: updateState.latestRelease?.changelog || null,
    notes: updateState.latestRelease?.notes || null,
    lastCheckedTime: updateState.lastCheckedTime,
    showStartupModal: updateState.showStartupModal || false,
    logs: updateState.logs || [],
    updateState,
    checkForUpdates,
    downloadAndInstall,
    restartAndInstall,
    dismissModal,
    clearLogs,
    getDiagnosticReport,
  };
}
