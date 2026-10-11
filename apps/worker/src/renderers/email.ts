import { renderEmailTemplate } from "@hono-commerce/notification/templates";

import type { EmailJobData } from "@hono-commerce/queue";

export async function renderJobEmail(data: EmailJobData): Promise<{
  html: string;
  text: string;
}> {
  switch (data.template) {
    case "magic-link":
      return await renderEmailTemplate(data.template, data.props);
    case "tenant-invitation":
      return await renderEmailTemplate(data.template, data.props);
    case "order-confirmation":
      return await renderEmailTemplate(data.template, data.props);
    case "system-alert":
      return await renderEmailTemplate(data.template, data.props);
  }
}
