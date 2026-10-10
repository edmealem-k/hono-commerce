export const routes = {
  public: {
    signIn: "/sign-in",
    verify: "/verify",
    invitation: ({ invitationId }: { invitationId: string }) =>
      `/invitations/${invitationId}`,
  },
  admin: {
    root: "/",
    tenants: "/tenants",
    tenant: ({ tenantId }: { tenantId: string }) => `/tenants/${tenantId}`,
    moderation: "/moderation",
    platformChat: "/platform-chat",
    queues: "/queues",
    settings: "/settings",
  },
  tenant: {
    root: "/",
    products: "/products",
    productNew: "/products/new",
    product: ({ productId }: { productId: string }) => `/products/${productId}`,
    productVariants: ({ productId }: { productId: string }) =>
      `/products/${productId}/variants`,
    orders: "/orders",
    order: ({ orderId }: { orderId: string }) => `/orders/${orderId}`,
    orderInvoice: ({ orderId }: { orderId: string }) =>
      `/orders/${orderId}/invoice`,
    team: "/team",
    teamInvite: "/team/invite",
    chat: "/chat",
    chatConversation: ({ conversationId }: { conversationId: string }) =>
      `/chat/${conversationId}`,
    settings: "/settings",
    settingsBilling: "/settings/billing",
  },
  storefront: {
    home: "/",
    catalog: "/catalog",
    product: ({ handle }: { handle: string }) => `/products/${handle}`,
    category: ({ category }: { category: string }) => `/categories/${category}`,
    cart: "/cart",
    checkout: "/checkout",
    account: "/account",
    accountOrders: "/account/orders",
    accountOrder: ({ orderId }: { orderId: string }) =>
      `/account/orders/${orderId}`,
  },
} as const;

export type AppRoutes = typeof routes;
