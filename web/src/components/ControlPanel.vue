<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n.ts';
import { getDefaultTextPair } from '../constants/textPairs.ts';
import {
  ACCENT_PRESETS,
  DEFAULT_STATE,
  FORMAT_OPTIONS,
  SCALE_OPTIONS,
  TEXT_COLOR_PRESETS,
} from '../constants.ts';
import type { EndpointType, LogoFormState, OutputFormat } from '../types.ts';
import ColorField from './ColorField.vue';

const props = defineProps<{
  state: LogoFormState;
}>();

const emit = defineEmits<{
  (e: 'change'): void;
  (e: 'titleInput'): void;
  (e: 'titleReset'): void;
}>();

const { lang, t } = useI18n();

// IME 输入法防抖合成状态
const isComposing = ref(false);

const handleInput = () => {
  if (isComposing.value) return;
  emit('change');
};

const handleCompositionStart = () => {
  isComposing.value = true;
};

const handleCompositionEnd = () => {
  isComposing.value = false;
  emit('change');
};

const imeInputHandlers = {
  input: handleInput,
  compositionstart: handleCompositionStart,
  compositionend: handleCompositionEnd,
};

// 重置单字段逻辑 - 严格基于 DEFAULT_STATE
const resetField = <K extends keyof LogoFormState>(key: K) => {
  props.state[key] = DEFAULT_STATE[key];
  emit('change');
};

const resetTitleText = () => {
  const pair = getDefaultTextPair(lang.value);
  props.state.left = pair.left;
  props.state.right = pair.right;
  emit('change');
  emit('titleReset');
};

const handleTitleInput = () => {
  handleInput();
  if (!isComposing.value) emit('titleInput');
};

const handleTitleCompositionEnd = () => {
  handleCompositionEnd();
  emit('titleInput');
};

const titleInputHandlers = {
  input: handleTitleInput,
  compositionstart: handleCompositionStart,
  compositionend: handleTitleCompositionEnd,
};

const resetTextColors = () => {
  props.state.textColor = props.state.dark ? '#FFFFFF' : DEFAULT_STATE.textColor;
  emit('change');
};

const handleTransparentToggle = () => {
  // 切换透明背景时，联动切换居中推荐模式
  props.state.center = !props.state.transparent;
  emit('change');
};

const handleDarkToggle = () => {
  if (props.state.dark && props.state.textColor.toLowerCase() === '#2b2b2b') {
    props.state.textColor = '#FFFFFF';
  } else if (!props.state.dark && props.state.textColor.toLowerCase() === '#ffffff') {
    props.state.textColor = '#2B2B2B';
  }
  emit('change');
};

const handleEndpointSelect = (ep: EndpointType) => {
  props.state.endpoint = ep;
  emit('change');
};

const handleScaleSelect = (scale: number) => {
  props.state.scale = scale;
  emit('change');
};

const handleFormatSelect = (fmt: OutputFormat) => {
  props.state.format = fmt;
  emit('change');
};

const handleColorPicker = (key: 'crossColor' | 'haloColor', e: Event) => {
  const target = e.target as HTMLInputElement;
  props.state[key] = target.value;
  emit('change');
};
</script>

<template>
  <div class="card controls-card">
    <!-- 战术卡片头部 -->
    <div class="card-header">
      <div class="card-title-group">
        <div class="card-sec-tag">// SCHALE CONFIG DESK</div>
        <div class="card-title">
          <span>{{ t('console-title') }}</span>
          <span class="card-title-slashes">///</span>
        </div>
      </div>
      <div class="endpoint-pills" id="endpointPills">
        <button
          type="button"
          class="pill-btn"
          :class="{ active: state.endpoint === 'api' }"
          @click="handleEndpointSelect('api')"
        >
          {{ t('ep-restful') }}
        </button>
        <button
          type="button"
          class="pill-btn"
          :class="{ active: state.endpoint === 'balogo' }"
          @click="handleEndpointSelect('balogo')"
        >
          {{ t('ep-legacy') }}
        </button>
      </div>
    </div>

    <!-- 01. 文本排版 -->
    <div class="tactical-section">
      <div class="section-divider">
        <span class="section-tag">{{ t('sec-text') }}</span>
      </div>

      <!-- 标题文字 -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-text">{{ t('label-title') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetTitleText"
            :title="t('tip-reset-text')"
          >
            {{ t('reset-text') }}
          </button>
        </label>
        <div class="form-row">
          <div class="input-with-tag">
            <span class="input-prefix-tag tag-blue">L</span>
            <input
              type="text"
              id="inputLeft"
              v-model="state.left"
              class="input-text"
              :placeholder="t('ph-left')"
              v-on="titleInputHandlers"
            >
          </div>
          <div class="input-with-tag">
            <span class="input-prefix-tag tag-dark">R</span>
            <input
              type="text"
              id="inputRight"
              v-model="state.right"
              class="input-text"
              :placeholder="t('ph-right')"
              v-on="titleInputHandlers"
            >
          </div>
        </div>
      </div>

      <!-- 副标题 -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-text">{{ t('label-sub') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('subtitle')"
            :title="t('tip-clear-sub')"
          >
            {{ t('reset-clear') }}
          </button>
        </label>
        <div class="subtitle-input-row">
          <input
            type="text"
            id="inputSub"
            v-model="state.subtitle"
            class="input-text"
            :placeholder="t('ph-sub')"
            v-on="imeInputHandlers"
          >
          <div class="color-picker-mini-wrapper" :title="t('tip-sub-color')">
            <input
              type="color"
              id="inputSubColor"
              v-model="state.subtitleColor"
              class="native-color-picker mini-picker"
              @input="handleInput"
            >
          </div>
        </div>
      </div>

      <!-- 副标题偏移量微调 -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-sub-x') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('subX')"
              :title="t('tip-reset-x')"
            >
              {{ t('reset-0') }}
            </button>
          </label>
          <input
            type="number"
            id="inputSubX"
            v-model.number="state.subX"
            class="input-text input-mono"
            placeholder="0"
            @input="handleInput"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-sub-y') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('subY')"
              :title="t('tip-reset-y')"
            >
              {{ t('reset-0') }}
            </button>
          </label>
          <input
            type="number"
            id="inputSubY"
            v-model.number="state.subY"
            class="input-text input-mono"
            placeholder="0"
            @input="handleInput"
          >
        </div>
      </div>
    </div>

    <!-- 02. 色彩配置 -->
    <div class="tactical-section">
      <div class="section-divider">
        <span class="section-tag">{{ t('sec-colors') }}</span>
      </div>

      <!-- 主题色彩 -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-text">{{ t('label-accent') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('accent')"
            :title="t('tip-reset-accent')"
          >
            {{ t('reset-accent') }}
          </button>
        </label>
        <ColorField
          v-model="state.accent"
          :presets="ACCENT_PRESETS"
          @update:modelValue="handleInput"
        />
      </div>

      <!-- 文字主题色彩 -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-text">{{ t('label-text-color') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetTextColors"
            :title="t('tip-reset-text-color')"
          >
            {{ t('reset-text-color') }}
          </button>
        </label>
        <ColorField
          v-model="state.textColor"
          :presets="TEXT_COLOR_PRESETS"
          @update:modelValue="handleInput"
        />
      </div>

      <!-- 独立十字与光环颜色 (可选独立定制) -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-cross-color') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('crossColor')"
              :title="t('tip-follow-accent')"
            >
              {{ t('reset-follow') }}
            </button>
          </label>
          <div class="input-with-picker">
            <input
              type="text"
              id="inputCrossColor"
              v-model="state.crossColor"
              class="input-text input-mono"
              :placeholder="t('ph-cross-color')"
              @input="handleInput"
            >
            <input
              type="color"
              id="pickerCrossColor"
              :value="state.crossColor || state.accent"
              class="native-color-picker mini-picker"
              :title="t('tip-cross-picker')"
              @input="handleColorPicker('crossColor', $event)"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-halo-color') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('haloColor')"
              :title="t('tip-follow-text-color')"
            >
              {{ t('reset-follow') }}
            </button>
          </label>
          <div class="input-with-picker">
            <input
              type="text"
              id="inputHaloColor"
              v-model="state.haloColor"
              class="input-text input-mono"
              :placeholder="t('ph-halo-color')"
              @input="handleInput"
            >
            <input
              type="color"
              id="pickerHaloColor"
              :value="state.haloColor || state.textColor"
              class="native-color-picker mini-picker"
              :title="t('tip-halo-picker')"
              @input="handleColorPicker('haloColor', $event)"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 03. 坐标与间距 -->
    <div class="tactical-section">
      <div class="section-divider">
        <span class="section-tag">{{ t('sec-layout') }}</span>
      </div>

      <!-- 坐标偏移 -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-x-offset') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('x')"
              :title="t('tip-reset-x')"
            >
              {{ t('reset-x') }}
            </button>
          </label>
          <input
            type="number"
            id="inputX"
            v-model.number="state.x"
            class="input-text input-mono"
            placeholder="-15"
            @input="handleInput"
          >
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-y-offset') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('y')"
              :title="t('tip-reset-y')"
            >
              {{ t('reset-0') }}
            </button>
          </label>
          <input
            type="number"
            id="inputY"
            v-model.number="state.y"
            class="input-text input-mono"
            placeholder="0"
            @input="handleInput"
          >
        </div>
      </div>

      <!-- 两词间距与留白 -->
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-word-gap') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('wordGap')"
              :title="t('tip-reset-gap')"
            >
              {{ t('reset-0') }}
            </button>
          </label>
          <input
            type="number"
            id="inputWordGap"
            v-model.number="state.wordGap"
            class="input-text input-mono"
            placeholder="0"
            @input="handleInput"
          >
        </div>

        <div class="form-group" id="paddingGroup">
          <label class="form-label">
            <span class="label-text">{{ t('label-padding') }}</span>
            <button
              type="button"
              class="reset-badge"
              @click="resetField('padding')"
              :title="t('tip-reset-pad')"
            >
              {{ t('reset-pad') }}
            </button>
          </label>
          <input
            type="text"
            id="inputPadding"
            v-model="state.padding"
            class="input-text input-mono"
            :placeholder="t('ph-padding')"
            @input="handleInput"
          >
        </div>
      </div>
    </div>

    <!-- 04. 规格与开关 -->
    <div class="tactical-section">
      <div class="section-divider">
        <span class="section-tag">{{ t('sec-output') }}</span>
      </div>

        <!-- 分辨率倍率 -->
        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-scale') }}</span>
          </label>
          <div class="scale-pills" id="scalePills">
            <button
              v-for="item in SCALE_OPTIONS"
              :key="item.value"
              type="button"
              class="pill-btn"
              :class="{ active: state.scale === item.value }"
              @click="handleScaleSelect(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 导出格式 -->
        <div class="form-group">
          <label class="form-label">
            <span class="label-text">{{ t('label-format') }}</span>
          </label>
          <div class="format-pills" id="formatPills">
            <button
              v-for="item in FORMAT_OPTIONS"
              :key="item.format"
              type="button"
              class="pill-btn format-pill-btn"
              :class="{ active: state.format === item.format }"
              @click="handleFormatSelect(item.format)"
            >
              {{ t(item.i18nKey) }}
            </button>
          </div>
        </div>

      <!-- 开关项 -->
      <div class="toggles-grid">
        <label class="toggle-item">
          <span>{{ t('toggle-tp') }}</span>
          <div class="switch">
            <input
              type="checkbox"
              id="toggleTp"
              v-model="state.transparent"
              @change="handleTransparentToggle"
            >
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>{{ t('toggle-dark') }}</span>
          <div class="switch">
            <input
              type="checkbox"
              id="toggleDark"
              v-model="state.dark"
              @change="handleDarkToggle"
            >
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>{{ t('toggle-swap') }}</span>
          <div class="switch">
            <input
              type="checkbox"
              id="toggleSwap"
              v-model="state.swap"
              @change="handleInput"
            >
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item">
          <span>{{ t('toggle-center') }}</span>
          <div class="switch">
            <input
              type="checkbox"
              id="toggleCenter"
              v-model="state.center"
              @change="handleInput"
            >
            <span class="slider"></span>
          </div>
        </label>

        <label class="toggle-item toggle-fullwidth">
          <span>{{ t('toggle-behind') }}</span>
          <div class="switch">
            <input
              type="checkbox"
              id="toggleBehind"
              v-model="state.behind"
              @change="handleInput"
            >
            <span class="slider"></span>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
