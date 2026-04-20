import type { CustomSubspeciesDefinition } from '@/types/module';

export default function (): CustomSubspeciesDefinition {
  return {
    id: foundry.utils.randomID(),
    name: 'New Subspecies',
  };
}
