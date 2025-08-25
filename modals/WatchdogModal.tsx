/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  ModalRoot,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalSize,
  closeAllModals,
  openModal,
} from '@utils/modal';
import {
  Button,
  FluxDispatcher,
  React,
  Text,
  NavigationRouter,
} from '@webpack/common';
import { getLogs, clearLogs } from '../data/logDB';
import { classNameFactory } from '@api/Styles';
import './WatchdogModal.css';

const cl = classNameFactory('watchdog-modal-');

function formatDateTime(timestamp?: number): string {
  if (!timestamp) return 'N/A';

  const date = new Date(timestamp);
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const day = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `${time} ${day}`;
}

export function openWatchdogModal() {
  openModal((modalProps) => <WatchdogModal modalProps={modalProps} />);
}

function WatchdogModal({ modalProps }: { modalProps: any }) {
  const [logs, setLogs] = React.useState([]);

  React.useEffect(() => {
    const update = async () => {
      const latest = await getLogs();
      latest.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(latest);
    };

    update();

    const handler = () => {
      update();
    };
    FluxDispatcher.subscribe('WATCHDOG_LOGS_UPDATED', handler);

    return () => {
      FluxDispatcher.unsubscribe('WATCHDOG_LOGS_UPDATED', handler);
    };
  }, []);

  return (
    <ModalRoot {...modalProps} size={ModalSize.SMALL} className={cl('root')}>
      <ModalHeader className={cl('header')}>Watchdog Logs</ModalHeader>
      <ModalContent className={cl('content')}>
        {logs.length === 0 ? (
          <Text>No mentions logged.</Text>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={cl('entry')}>
              <img src={log.avatar} className={cl('avatar')} />
              <div className={cl('contentInner')}>
                <div className={cl('entryHeader')}>
                  <span className={cl('username')}>{log.user}</span>
                  <span className={cl('timestamp')}>
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
                <div className={cl('body')}>{log.content}</div>
                <div className={cl('actions')}>
                  <Button
                    size={Button.Sizes.SMALL}
                    onClick={() => {
                      NavigationRouter.transitionTo(
                        `/channels/${log.guildId ?? '@me'}/${log.channelId}/${
                          log.id
                        }`
                      );
                      closeAllModals();
                    }}
                  >
                    Jump
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </ModalContent>

      {logs.length > 0 && (
        <ModalFooter className={cl('footer')}>
          <Button
            color={Button.Colors.RED}
            onClick={async () => {
              await clearLogs();
              setLogs([]);
            }}
          >
            Clear Logs
          </Button>
        </ModalFooter>
      )}
    </ModalRoot>
  );
}
