// Port from PostsService (Next.js) to uni-app / WeChat Mini Program.
const STRAPI_URL = "https://cms.vyansoftglobal.com";

// Nếu Public role chưa mở find/findOne -> dán API token read-only vào đây.
const API_TOKEN = "";

// ---- serialize  Strapi. query (populate[0]=cover, filters[slug][$eq]=...) ----
function buildQueryString(params) {
  const parts = [];
  function push(key, val) {
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) {
      val.forEach((v, i) => push(`${key}[${i}]`, v));
    } else if (typeof val === "object") {
      for (const k of Object.keys(val)) push(`${key}[${k}]`, val[k]);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`);
    }
  }
  for (const key of Object.keys(params)) push(key, params[key]);
  return parts.join("&");
}

function request(path, opts = {}) {
  return new Promise((resolve, reject) => {
    const base = `${STRAPI_URL}/api/${path.replace(/^\/|\/$/g, "")}`;
    const qs = opts.query ? buildQueryString(opts.query) : "";
    const url = qs ? `${base}?${qs}` : base;

    uni.request({
      url,
      method: "GET",
      header: {
        Accept: "application/json",
        ...(API_TOKEN ? { Authorization: "Bearer " + API_TOKEN } : {})
      },
      timeout: 8000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const msg = res.data && res.data.error
            ? res.data.error.message
            : "HTTP " + res.statusCode;
          reject(new Error(`Strapi API error ${res.statusCode}: ${msg}`));
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || "network fail"));
      }
    });
  });
}

// Media field (v5: cover.url; v4: cover.data.attributes.url). URL local -> ghép host.
export function mediaUrl(cover) {
  if (!cover) return "";
  const u = cover.url || (cover.data && cover.data.attributes && cover.data.attributes.url) || "";
  if (!u) return "";
  return u.startsWith("http") ? u : STRAPI_URL + u;
}

export const PostsService = {
  list(opts = {}) {
    const query = {};
    query.populate = opts.populate ?? ["cover", "project"];
    if (opts.filters) query.filters = opts.filters;
    if (opts.pagination) query.pagination = opts.pagination;
    if (opts.sort) query.sort = opts.sort;
    return request("posts", { query }); // -> { data: Post[], meta }
  },

  async findBySlug(slug, opts = {}) {
    const res = await this.list({
      filters: { slug: { $eq: slug } },
      populate: opts.populate ?? ["cover", "project"]
    });
    return (res.data && res.data[0]) || null;
  }
};

export default PostsService;
