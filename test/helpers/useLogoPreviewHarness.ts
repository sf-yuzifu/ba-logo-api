import { createRenderer, defineComponent, h } from 'vue';
import { useLogoPreview } from '../../web/src/composables/useLogoPreview.ts';
import type { LogoFormState } from '../../web/src/types.ts';

interface HostNode {
  type: string;
  children: HostNode[];
  parent: HostNode | null;
}

const renderer = createRenderer<HostNode, HostNode>({
  createElement: (type) => ({ type, children: [], parent: null }),
  createText: (text) => ({ type: text, children: [], parent: null }),
  createComment: (text) => ({ type: text, children: [], parent: null }),
  setText: (node, text) => {
    node.type = text;
  },
  setElementText: (node, text) => {
    node.children = [{ type: text, children: [], parent: node }];
  },
  patchProp: () => {},
  insert: (node, parent, anchor) => {
    node.parent = parent;
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    if (index < 0) parent.children.push(node);
    else parent.children.splice(index, 0, node);
  },
  remove: (node) => {
    if (!node.parent) return;
    const index = node.parent.children.indexOf(node);
    if (index >= 0) node.parent.children.splice(index, 1);
    node.parent = null;
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => {
    if (!node.parent) return null;
    return node.parent.children[node.parent.children.indexOf(node) + 1] ?? null;
  },
});

export function createPreviewHarness(state: LogoFormState) {
  let preview: ReturnType<typeof useLogoPreview> | undefined;

  const component = defineComponent({
    setup() {
      preview = useLogoPreview(state);
      return () => h('div');
    },
  });

  return {
    component,
    mount() {
      const root: HostNode = { type: 'root', children: [], parent: null };
      const app = renderer.createApp(component);
      app.mount(root);
      return () => app.unmount();
    },
    get api() {
      if (!preview) throw new Error('Harness has not been mounted');
      return preview;
    },
  };
}
