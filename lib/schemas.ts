import { z } from "zod";
import { MAX_COMMENT_LENGTH, MAX_TAGS_PER_PROJECT, MAX_TAG_LENGTH, TOOLS, CATEGORIES } from "./constants";

const projectIdField = z
  .string({ message: "project_id가 필요합니다" })
  .uuid("유효하지 않은 프로젝트 ID입니다");

export const commentCreateSchema = z.object({
  project_id: projectIdField,
  content: z
    .string({ message: "내용을 입력해주세요" })
    .trim()
    .min(1, "내용을 입력해주세요")
    .max(MAX_COMMENT_LENGTH, `댓글은 ${MAX_COMMENT_LENGTH}자 이내로 입력해주세요`),
});

export const likeToggleSchema = z.object({
  project_id: projectIdField,
});

export const viewIncrementSchema = z.object({
  project_id: projectIdField,
});

export const projectIdParamSchema = z
  .string({ message: "project_id가 필요합니다" })
  .uuid("유효하지 않은 프로젝트 ID입니다");

export const tagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(MAX_TAG_LENGTH, `태그는 ${MAX_TAG_LENGTH}자 이내로 입력해주세요`);

export const uploadMetaSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해주세요").max(100, "제목은 100자 이내로 입력해주세요"),
  description: z.string().max(500).nullable().optional(),
  tool_used: z.enum(TOOLS).nullable().optional(),
  category: z.enum(CATEGORIES).nullable().optional(),
  tags: z.array(tagSchema).max(MAX_TAGS_PER_PROJECT, `태그는 ${MAX_TAGS_PER_PROJECT}개까지 가능합니다`).default([]),
});
