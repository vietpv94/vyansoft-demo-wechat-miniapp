<template>
  <view class="page">
    <view class="header">
      <text class="h-title">Posts</text>
      <text class="h-sub">Posts · Strapi CMS</text>
    </view>

    <view v-if="loading" class="state">Đang tải...</view>

    <view v-else-if="error" class="state error">
      <text class="err-msg">{{ error }}</text>
      <button size="mini" type="primary" @click="load">Thử lại</button>
    </view>

    <view v-else class="list">
      <view
        v-for="post in posts"
        :key="post.documentId || post.id"
        class="item"
        @click="goDetail(post)"
      >
        <image
          v-if="cover(post)"
          class="thumb"
          :src="cover(post)"
          mode="aspectFill"
        />
        <view class="item-main">
          <text class="item-title">{{ post.title }}</text>
          <text class="item-excerpt">{{ post.excerpt || "" }}</text>
          <text class="item-date">{{ fmt(post.publishedAt || post.createdAt) }}</text>
        </view>
      </view>
      <view v-if="!posts.length" class="state">No posts available</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from "vue";
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app";
import { PostsService, mediaUrl } from "@/utils/request.js";

const posts = ref([]);
const loading = ref(false);
const error = ref("");

const cover = (p) => mediaUrl(p.cover);

function fmt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await PostsService.list({
      pagination: { pageSize: 10 },
      sort: ["publishedAt:desc"]
    });
    posts.value = res.data || [];
  } catch (e) {
    error.value = e.message || "không xác định";
  } finally {
    loading.value = false;
  }
}

function goDetail(post) {
  uni.navigateTo({ url: `/pages/detail/detail?slug=${encodeURIComponent(post.slug)}` });
}

onLoad(() => load());
onPullDownRefresh(async () => {
  await load();
  uni.stopPullDownRefresh();
});
</script>

<style>
.page { padding: 24rpx 28rpx 60rpx; }
.header { padding: 20rpx 0 24rpx; }
.h-title { font-size: 40rpx; font-weight: 700; display: block; }
.h-sub { font-size: 26rpx; color: #999; margin-top: 6rpx; display: block; }
.state { text-align: center; color: #999; font-size: 28rpx; padding: 80rpx 0; }
.state.error { color: #e64340; display: flex; flex-direction: column; gap: 24rpx; align-items: center; }
.err-msg { font-size: 24rpx; }
.item {
  display: flex; gap: 20rpx;
  background: #fff; border-radius: 18rpx; padding: 22rpx;
  margin-bottom: 20rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.04);
}
.thumb { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; background: #eee; }
.item-main { flex: 1; display: flex; flex-direction: column; }
.item-title { font-size: 30rpx; font-weight: 600; color: #1a1a1a; margin-bottom: 8rpx; }
.item-excerpt {
  font-size: 25rpx; color: #888; line-height: 1.5; flex: 1;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.item-date { font-size: 22rpx; color: #bbb; margin-top: 8rpx; }
</style>
