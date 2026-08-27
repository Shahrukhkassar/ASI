import React from 'react';
import { TestPlayer, TestPlayerProps } from './TestPlayer';
import { TestItem, UserProfile } from '../types';

export interface TestSimulatorModalProps {
  test: TestItem | null;
  user?: UserProfile | null;
  onClose: () => void;
  onFinish?: (result: any) => void;
}

/**
 * TestSimulatorModal - Wraps the Ultra Pro TestPlayer
 */
export const TestSimulatorModal: React.FC<TestSimulatorModalProps> = ({
  test,
  user,
  onClose,
  onFinish
}) => {
  if (!test) return null;

  return (
    <TestPlayer
      test={test}
      user={user}
      onClose={onClose}
      onFinish={onFinish}
    />
  );
};

export default TestSimulatorModal;
