/**
 * 安全生成头像标签的辅助函数
 * 避免 substring undefined 错误
 */

/**
 * 从姓名生成头像标签
 * @param {string|null|undefined} name - 姓名
 * @param {string} fallback - 默认标签，默认为 "UN"
 * @returns {string} 两个字符的头像标签
 */
export const generateAvatarLabel = (name, fallback = "UN") => {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return fallback;
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 1) {
    return trimmedName.toUpperCase() + "?";
  }

  return trimmedName.substring(0, 2).toUpperCase();
};

/**
 * 从对象中安全获取姓名并生成头像标签
 * @param {object} obj - 包含姓名字段的对象
 * @param {string[]} nameFields - 可能的姓名字段名数组
 * @param {string} fallback - 默认标签
 * @returns {string} 两个字符的头像标签
 */
export const generateAvatarLabelFromObject = (
  obj,
  nameFields = ["name", "full_name", "author_name", "sender_name"],
  fallback = "UN"
) => {
  if (!obj || typeof obj !== "object") {
    return fallback;
  }

  for (const field of nameFields) {
    const name = obj[field];
    if (name && typeof name === "string" && name.trim().length > 0) {
      return generateAvatarLabel(name, fallback);
    }
  }

  return fallback;
};

/**
 * 安全的用户姓名显示
 * @param {object} user - 用户对象
 * @param {string} fallback - 默认显示名
 * @returns {string} 用户显示名
 */
export const getUserDisplayName = (user, fallback = "Unknown User") => {
  if (!user || typeof user !== "object") {
    return fallback;
  }

  return (
    user.full_name ||
    user.name ||
    user.author_name ||
    user.sender_name ||
    fallback
  );
};
