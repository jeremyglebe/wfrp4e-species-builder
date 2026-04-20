import type { AggregateItemBuilderSettings } from '@/types/module';

export default function (): AggregateItemBuilderSettings {
  return {
    defaultFolderId: '',
    fallbackFolderName: 'Effect Items',
    rememberLastFolder: true,
    defaultPrefix: 'Bundle:',
    defaultSuffix: '',
    defaultItemType: 'trait',
    effectMode: 'single',
    defaultEffectName: 'Grant Items',
  };
}
