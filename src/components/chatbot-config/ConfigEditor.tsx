import React from 'react';
import { Modal } from 'react-native';
import { SystemPromptEditor } from './SystemPromptEditor';
import { ToolsConfigEditor } from './ToolsConfigEditor';
import { JsonEditor } from './JsonEditor';

interface ConfigEditorProps {
  visible: boolean;
  configKey: string;
  configValue: any;
  onSave: (value: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  visible,
  configKey,
  configValue,
  onSave,
  onCancel,
  loading = false
}) => {
  const renderEditor = () => {
    switch (configKey) {
      case 'system_prompt':
        return (
          <SystemPromptEditor
            initialValue={configValue}
            onSave={onSave}
            onCancel={onCancel}
            loading={loading}
          />
        );

      case 'tools_config':
        return (
          <ToolsConfigEditor
            initialValue={configValue}
            onSave={onSave}
            onCancel={onCancel}
            loading={loading}
          />
        );

      default:
        return (
          <JsonEditor
            initialValue={configValue}
            onSave={onSave}
            onCancel={onCancel}
            loading={loading}
          />
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      {renderEditor()}
    </Modal>
  );
};
