import type { CustomSubspeciesDefinition } from '@/shared/types/module';

export default function (): CustomSubspeciesDefinition {
  return {
    id: foundry.utils.randomID(),
    name: 'New Subspecies',
  };
}
