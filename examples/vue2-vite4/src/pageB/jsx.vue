<script lang="jsx">
export default {
  name: 'JSXView',
  functional: true,
  props: {
    icon: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },
  render(h, context) {
    const { icon, title } = context.props;
    const vnodes = [];

    if (icon) {
      vnodes.push(<p>{icon}</p>);
    }

    if (title) {
      vnodes.push(<span slot="title">{title}</span>);
    }
    return vnodes;
  }
};
</script>
