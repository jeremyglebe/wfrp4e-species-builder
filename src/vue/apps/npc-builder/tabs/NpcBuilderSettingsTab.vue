<template>
    <section class="npc-builder__options-grid">
        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Folders</div>

            <div class="npc-builder__form-group">
                <label>Base Folder Name:</label>
                <div class="npc-builder__input-row">
                    <input v-model="settings.baseFolderName" type="text" class="npc-builder__input" />
                    <button type="button" class="npc-builder__button npc-builder__button--primary"
                        @click="saveFolderSettings" :disabled="isBusy">
                        Save
                    </button>
                </div>
                <div class="npc-builder__status">
                    <span :style="{ color: baseFolderFound ? '#888' : '#d35400' }">
                        {{ baseFolderFound ? '✓ Found' : '✗ Not found yet' }}
                    </span>
                </div>
            </div>

            <div class="npc-builder__form-group">
                <label>Output Folder Name:</label>
                <input v-model="settings.outputFolderName" type="text" class="npc-builder__input" />
                <div class="npc-builder__status">
                    <span :style="{ color: outputFolderFound ? '#888' : '#d35400' }">
                        {{ outputFolderFound ? '✓ Found' : '✗ Not found yet' }}
                    </span>
                </div>
            </div>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Behavior</div>

            <label class="npc-builder__checkbox">
                <input v-model="settings.includeSpeciesInName" type="checkbox" />
                <span>Include Species / Ancestry / Race in Actor Name</span>
            </label>

            <label class="npc-builder__checkbox">
                <input v-model="settings.autoAddLowerCareers" type="checkbox" />
                <span>Auto-add lower careers from same career group</span>
            </label>
            <div class="npc-builder__hint">
                Searches world items and all item compendiums. Lower careers are inserted before the dropped
                career.
            </div>

            <label class="npc-builder__checkbox">
                <input v-model="settings.enhanceImage" type="checkbox" />
                <span>Enhance Image?</span>
            </label>

            <label class="npc-builder__checkbox">
                <input v-model="settings.circularToken" type="checkbox" />
                <span>Circular Token?</span>
            </label>
        </div>

        <div class="npc-builder__section">
            <div class="npc-builder__section-title">Base Actor Advancement Options</div>
            <div class="npc-builder__hint">
                Control which base actor advancements can be upgraded in the Skills & Talents tab. Career-derived
                baselines are always available and always editable.
            </div>

            <label class="npc-builder__checkbox">
                <input v-model="settings.allowUpgradeBaseSkills" type="checkbox" />
                <span>Allow upgrading base actor skills</span>
            </label>
            <div class="npc-builder__hint">
                Base skill values do not count as prior advances; they start from 0 for XP purposes.
            </div>

            <label class="npc-builder__checkbox">
                <input v-model="settings.allowUpgradeBaseCharacteristics" type="checkbox" />
                <span>Allow upgrading base actor characteristics</span>
            </label>
            <div class="npc-builder__hint">
                Base characteristic values do not count as prior advances; they start from 0 for XP purposes.
            </div>

            <label class="npc-builder__checkbox">
                <input v-model="settings.allowUpgradeBaseTalents" type="checkbox" />
                <span>Allow upgrading base actor talents</span>
            </label>
            <div class="npc-builder__hint">
                Base talent ranks always count toward cost scaling, even if this is disabled. This only controls
                visibility and editability.
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import {
    getActorFolderByName,
    getOrCreateActorFolderByName,
    normalizeFolderName,
} from '../../../../module/services/settings/npcs';
import { useNpcBuilderStore } from '../../../stores';

/**
 * Settings tab: hosts existing folder and behavior configuration UI.
 * No behavior changes; this is moved out of Main to keep tab concerns focused.
 */
const store = useNpcBuilderStore();
const { settings, isBusy } = storeToRefs(store);

const baseFolderFound = computed(() => {
    return Boolean(getActorFolderByName(settings.value.baseFolderName));
});

const outputFolderFound = computed(() => {
    return Boolean(getActorFolderByName(settings.value.outputFolderName));
});

async function saveFolderSettings(): Promise<void> {
    settings.value.baseFolderName = normalizeFolderName(settings.value.baseFolderName);
    settings.value.outputFolderName = normalizeFolderName(settings.value.outputFolderName);
    await store.saveToStorage();

    if (settings.value.baseFolderName) {
        await getOrCreateActorFolderByName(settings.value.baseFolderName);
    }

    ui.notifications?.info('NPC Builder folder settings saved.');
}
</script>
