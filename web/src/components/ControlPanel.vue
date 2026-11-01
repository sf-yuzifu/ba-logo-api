<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '../composables/useI18n.ts';
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

const emit = defineEmits<(e: 'change') => void>();

const { t } = useI18n();

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

// 重置单字段逻辑 - 严格基于 DEFAULT_STATE
const resetField = <K extends keyof LogoFormState>(key: K) => {
  props.state[key] = DEFAULT_STATE[key];
  emit('change');
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

const handleCrossColorPicker = (e: Event) => {
  const target = e.target as HTMLInputElement;
  props.state.crossColor = target.value;
  emit('change');
};

const handleHaloColorPicker = (e: Event) => {
  const target = e.target as HTMLInputElement;
  props.state.haloColor = target.value;
  emit('change');
};
</script>

<template>
  <div class="card controls-card">
    <div class="card-header">
      <div class="card-title">{{ t('console-title') }}</div>
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

    <!-- 标题文字 -->
    <div class="form-group">
      <label class="form-label">
        <span>{{ t('label-title') }}</span>
        <button
          type="button"
          class="reset-badge"
          @click="() => { resetField('left'); resetField('right'); }"
          title="重置文字"
        >
          {{ t('reset-text') }}
        </button>
      </label>
      <div class="form-row">
        <input
          type="text"
          id="inputLeft"
          v-model="state.left"
          class="input-text"
          :placeholder="t('ph-left')"
          @input="handleInput"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        >
        <input
          type="text"
          id="inputRight"
          v-model="state.right"
          class="input-text"
          :placeholder="t('ph-right')"
          @input="handleInput"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        >
      </div>
    </div>

    <!-- 副标题 -->
    <div class="form-group">
      <label class="form-label">
        <span>{{ t('label-sub') }}</span>
        <button
          type="button"
          class="reset-badge"
          @click="resetField('subtitle')"
          title="清空副标题"
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
          @input="handleInput"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        >
        <input
          type="color"
          id="inputSubColor"
          v-model="state.subtitleColor"
          class="color-picker-sub"
          title="副标题专属颜色"
          @input="handleInput"
        >
      </div>
    </div>

    <!-- 副标题偏移量微调 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">
          <span>{{ t('label-sub-x') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('subX')"
            title="重置 X 偏移"
          >
            {{ t('reset-0') }}
          </button>
        </label>
        <input
          type="number"
          id="inputSubX"
          v-model.number="state.subX"
          class="input-text"
          placeholder="0"
          @input="handleInput"
        >
      </div>

      <div class="form-group">
        <label class="form-label">
          <span>{{ t('label-sub-y') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('subY')"
            title="重置 Y 偏移"
          >
            {{ t('reset-0') }}
          </button>
        </label>
        <input
          type="number"
          id="inputSubY"
          v-model.number="state.subY"
          class="input-text"
          placeholder="0"
          @input="handleInput"
        >
      </div>
    </div>

    <!-- 主题色彩 -->
    <div class="form-group">
      <label class="form-label">
        <span>{{ t('label-accent') }}</span>
        <button
          type="button"
          class="reset-badge"
          @click="resetField('accent')"
          title="重置强调色"
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
        <span>{{ t('label-text-color') }}</span>
        <button
          type="button"
          class="reset-badge"
          @click="resetTextColors"
          title="重置文字色"
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
    <div class="form-group">
      <label class="form-label">
        <span>{{ t('label-cross-color') }}</span>
        <button
          type="button"
          class="reset-badge"
          @click="resetField('crossColor')"
          title="跟随强调色"
        >
          {{ t('reset-follow') }}
        </button>
      </label>
      <div style="display: flex; gap: 8px;">
        <input
          type="text"
          id="inputCrossColor"
          v-model="state.crossColor"
          class="input-text"
          :placeholder="t('ph-cross-color')"
          @input="handleInput"
        >
        <input
          type="color"
          id="pickerCrossColor"
          :value="state.crossColor || state.accent"
          title="十字拾色器"
          @input="handleCrossColorPicker"
        >
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">
        <span>{{ t('label-halo-color') }}</span>
        <button
          type="button"
          class="reset-badge"
          @click="resetField('haloColor')"
          title="跟随文字色"
        >
          {{ t('reset-follow') }}
        </button>
      </label>
      <div style="display: flex; gap: 8px;">
        <input
          type="text"
          id="inputHaloColor"
          v-model="state.haloColor"
          class="input-text"
          :placeholder="t('ph-halo-color')"
          @input="handleInput"
        >
        <input
          type="color"
          id="pickerHaloColor"
          :value="state.haloColor || state.textColor"
          title="光环拾色器"
          @input="handleHaloColorPicker"
        >
      </div>
    </div>

    <!-- 坐标偏移 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">
          <span>{{ t('label-x-offset') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('x')"
            title="重置 X 偏移"
          >
            {{ t('reset-x') }}
          </button>
        </label>
        <input
          type="number"
          id="inputX"
          v-model.number="state.x"
          class="input-text"
          placeholder="-15"
          @input="handleInput"
        >
      </div>

      <div class="form-group">
        <label class="form-label">
          <span>{{ t('label-y-offset') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('y')"
            title="重置 Y 偏移"
          >
            {{ t('reset-0') }}
          </button>
        </label>
        <input
          type="number"
          id="inputY"
          v-model.number="state.y"
          class="input-text"
          placeholder="0"
          @input="handleInput"
        >
      </div>
    </div>

    <!-- 两词间距与留白 -->
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">
          <span>{{ t('label-word-gap') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('wordGap')"
            title="重置间距"
          >
            {{ t('reset-0') }}
          </button>
        </label>
        <input
          type="number"
          id="inputWordGap"
          v-model.number="state.wordGap"
          class="input-text"
          placeholder="0"
          @input="handleInput"
        >
      </div>

      <div class="form-group" id="paddingGroup">
        <label class="form-label">
          <span>{{ t('label-padding') }}</span>
          <button
            type="button"
            class="reset-badge"
            @click="resetField('padding')"
            title="重置留白"
          >
            {{ t('reset-pad') }}
          </button>
        </label>
        <input
          type="text"
          id="inputPadding"
          v-model="state.padding"
          class="input-text"
          :placeholder="t('ph-padding')"
          @input="handleInput"
        >
      </div>
    </div>

    <!-- 分辨率倍率 -->
    <div class="form-group">
      <label class="form-label">{{ t('label-scale') }}</label>
      <div class="format-pills" id="scalePills">
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
      <label class="form-label">{{ t('label-format') }}</label>
      <div class="format-pills" id="formatPills">
        <button
          v-for="item in FORMAT_OPTIONS"
          :key="item.format"
          type="button"
          class="pill-btn"
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

      <label class="toggle-item">
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
</template>
