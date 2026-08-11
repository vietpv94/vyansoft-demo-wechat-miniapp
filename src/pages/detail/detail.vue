<template>
  <view class="page">
    <view v-if="loading" class="state">Đang tải...</view>
    <view v-else-if="error" class="state error">{{ error }}</view>
    <view v-else-if="post" class="article">
      <image v-if="coverUrl" class="cover" :src="coverUrl" mode="widthFix" />
      <text class="title">{{ post.title }}</text>
      <text class="date">{{ fmt(post.publishedAt || post.createdAt) }}</text>
      <text v-if="post.excerpt" class="excerpt">{{ post.excerpt }}</text>
      <view v-if="contentHtml" class="content">
        <rich-text :nodes="contentHtml" />
      </view>
    </view>
    <view v-else class="state">Post not found</view>
  </view>
</template>

<script setup>
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { PostsService, mediaUrl } from "@/utils/request.js";

const post = ref(null);
const loading = ref(false);
const error = ref("");

const coverUrl = computed(() => (post.value ? mediaUrl(post.value.cover) : ""));
function responsiveHtml(html) {
  // Strapi's editor exports image dimensions such as width="2240". Those values
  // make the article overflow on phones, so let the container control the width.
  return html.replace(/<img\b([^>]*)>/gi, (_, attributes) => {
    const withoutDimensions = attributes.replace(/\s(?:width|height|srcset|sizes)=("[^"]*"|'[^']*')/gi, "");
    const style = /\sstyle=("[^"]*"|'[^']*')/i;
    if (style.test(withoutDimensions)) {
      return `<img${withoutDimensions.replace(style, (attribute) => {
        const quote = attribute.includes("'") ? "'" : '"';
        const existingStyle = attribute.slice(attribute.indexOf(quote) + 1, -1);
        return ` style=${quote}${existingStyle};max-width:100%;width:100%;height:auto;display:block;${quote}`;
      })}>`;
    }
    return `<img${withoutDimensions} style="max-width:100%;width:100%;height:auto;display:block;">`;
  });
}

// `rich-text` renders Strapi's HTML instead of showing the tags as plain text.
const contentHtml = computed(() => {
  const content = post.value?.content;
  return typeof content === "string" ? responsiveHtml(content) : "";
});

function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

onLoad(async (query) => {
  loading.value = true;
  try {
    post.value = await PostsService.findBySlug(decodeURIComponent(query.slug));
  } catch (e) {
    error.value = e.message || "unknown error";
  } finally {
    loading.value = false;
  }
});
</script>

<style>
.page { padding: 0 0 60rpx; }
.article { padding: 0 28rpx; }
.cover { width: 100%; border-radius: 0 0 20rpx 20rpx; margin-bottom: 24rpx; background: #eee; }
.title { font-size: 40rpx; font-weight: 700; line-height: 1.4; display: block; margin-top: 24rpx; }
.date { font-size: 24rpx; color: #aaa; display: block; margin: 14rpx 0; }
.excerpt { font-size: 28rpx; color: #666; font-style: italic; display: block; margin-bottom: 24rpx; line-height: 1.6; }
.content { font-size: 30rpx; color: #333; line-height: 1.8; display: block; max-width: 100%; overflow-x: auto; }
.content rich-text { display: block; max-width: 100%; }
.content img { display: block; max-width: 100% !important; height: auto !important; margin: 24rpx auto; }
.content table { width: 100% !important; max-width: 100% !important; table-layout: fixed; }
.content td, .content th { overflow-wrap: anywhere; word-break: break-word; }
.state { text-align: center; color: #999; padding: 100rpx 40rpx; }
.state.error { color: #e64340; font-size: 24rpx; }
</style>
