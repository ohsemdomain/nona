import { Hono } from "hono";
import { eq, and, isNull } from "drizzle-orm";
import { createDb, publicLink, order, orderLine, item } from "../db";

const app = new Hono<{ Bindings: Env }>();

// Status labels and colors for inline CSS
const STATUS_LABEL: Record<string, string> = {
	draft: "Draft",
	pending: "Pending",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
	draft: { bg: "#f4f4f5", text: "#3f3f46" },
	pending: { bg: "#fef3c7", text: "#92400e" },
	confirmed: { bg: "#dbeafe", text: "#1e40af" },
	completed: { bg: "#dcfce7", text: "#166534" },
	cancelled: { bg: "#fee2e2", text: "#991b1b" },
};

function formatMoney(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(cents / 100);
}

function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const year = date.getFullYear().toString().slice(-2);
	return `${day}.${month}.${year}`;
}

function renderExpiredPage(baseUrl: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="robots" content="noindex, nofollow">
	<title>Link Expired</title>
	<meta property="og:title" content="Link Expired">
	<meta property="og:description" content="This shared link has expired.">
	<meta property="og:type" content="website">
	<meta property="og:url" content="${baseUrl}">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			background: #fafafa;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 16px;
		}
		.container {
			background: #fff;
			border: 1px solid #eaeaea;
			border-radius: 8px;
			padding: 48px;
			text-align: center;
			max-width: 400px;
		}
		h1 { color: #171717; font-size: 24px; margin-bottom: 12px; }
		p { color: #666; font-size: 14px; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Link Expired</h1>
		<p>This shared link is no longer valid.</p>
	</div>
</body>
</html>`;
}

function renderNotFoundPage(baseUrl: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="robots" content="noindex, nofollow">
	<title>Not Found</title>
	<meta property="og:title" content="Not Found">
	<meta property="og:description" content="This link does not exist.">
	<meta property="og:type" content="website">
	<meta property="og:url" content="${baseUrl}">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			background: #fafafa;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 16px;
		}
		.container {
			background: #fff;
			border: 1px solid #eaeaea;
			border-radius: 8px;
			padding: 48px;
			text-align: center;
			max-width: 400px;
		}
		h1 { color: #171717; font-size: 24px; margin-bottom: 12px; }
		p { color: #666; font-size: 14px; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Not Found</h1>
		<p>This link does not exist.</p>
	</div>
</body>
</html>`;
}

interface OrderData {
	id: number;
	orderNumber: string | null;
	status: string;
	total: number;
	lineList: {
		id: number;
		quantity: number;
		unitPrice: number;
		lineTotal: number;
		itemName: string | null;
	}[];
}

function renderOrderPage(
	orderData: OrderData,
	expiresAt: number,
	baseUrl: string,
): string {
	const statusColor = STATUS_COLOR[orderData.status] || STATUS_COLOR.draft;
	const statusLabel = STATUS_LABEL[orderData.status] || orderData.status;
	const expiresDate = formatDate(expiresAt);

	const lineItemsHtml = orderData.lineList
		.map(
			(line) => `
		<div class="line-item">
			<div class="line-info">
				<span class="line-name">${escapeHtml(line.itemName || "Unknown Item")}</span>
				<span class="line-detail">${formatMoney(line.unitPrice)} x ${line.quantity}</span>
			</div>
			<span class="line-total">${formatMoney(line.lineTotal)}</span>
		</div>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="robots" content="noindex, nofollow">
	<title>Order ${orderData.orderNumber || '#' + orderData.id}</title>
	<meta property="og:title" content="Order ${orderData.orderNumber || '#' + orderData.id}">
	<meta property="og:description" content="Expires: ${expiresDate}">
	<meta property="og:type" content="website">
	<meta property="og:url" content="${baseUrl}">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			background: #fafafa;
			min-height: 100vh;
			padding: 24px 16px;
		}
		.container {
			background: #fff;
			border: 1px solid #eaeaea;
			border-radius: 8px;
			max-width: 480px;
			margin: 0 auto;
			overflow: hidden;
		}
		.header {
			padding: 24px;
			border-bottom: 1px solid #eaeaea;
		}
		.order-id {
			font-size: 20px;
			font-weight: 600;
			color: #171717;
			margin-bottom: 16px;
		}
		.meta-row {
			display: flex;
			gap: 24px;
			margin-bottom: 8px;
		}
		.meta-item { flex: 1; }
		.meta-label {
			font-size: 12px;
			color: #999;
			margin-bottom: 4px;
		}
		.meta-value {
			font-size: 14px;
			color: #171717;
		}
		.status-badge {
			display: inline-block;
			padding: 4px 10px;
			border-radius: 9999px;
			font-size: 12px;
			font-weight: 500;
			background: ${statusColor.bg};
			color: ${statusColor.text};
		}
		.total-value {
			font-size: 18px;
			font-weight: 600;
		}
		.content {
			padding: 24px;
		}
		.section-title {
			font-size: 14px;
			font-weight: 500;
			color: #171717;
			margin-bottom: 12px;
		}
		.line-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px;
			border: 1px solid #eaeaea;
			border-radius: 6px;
			margin-bottom: 8px;
		}
		.line-info { flex: 1; min-width: 0; }
		.line-name {
			display: block;
			font-size: 14px;
			font-weight: 500;
			color: #171717;
		}
		.line-detail {
			display: block;
			font-size: 12px;
			color: #666;
			margin-top: 2px;
		}
		.line-total {
			font-size: 14px;
			font-weight: 500;
			color: #171717;
			flex-shrink: 0;
			margin-left: 12px;
		}
		.empty-state {
			font-size: 14px;
			color: #999;
		}
		.footer {
			padding: 16px 24px;
			border-top: 1px solid #eaeaea;
			background: #fafafa;
		}
		.expires-text {
			font-size: 12px;
			color: #999;
			text-align: center;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="order-id">Order ${escapeHtml(orderData.orderNumber || '#' + String(orderData.id))}</div>
			<div class="meta-row">
				<div class="meta-item">
					<div class="meta-label">Status</div>
					<div class="meta-value">
						<span class="status-badge">${statusLabel}</span>
					</div>
				</div>
				<div class="meta-item">
					<div class="meta-label">Total</div>
					<div class="meta-value total-value">${formatMoney(orderData.total)}</div>
				</div>
			</div>
		</div>
		<div class="content">
			<div class="section-title">Order Line (${orderData.lineList.length})</div>
			${orderData.lineList.length === 0 ? '<p class="empty-state">No item in this order.</p>' : lineItemsHtml}
		</div>
		<div class="footer">
			<p class="expires-text">This link expires on ${expiresDate}</p>
		</div>
	</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// GET /share/:linkId - Public shareable link
app.get("/:linkId", async (c) => {
	const db = createDb(c.env.DB);
	const linkId = c.req.param("linkId");
	const baseUrl = new URL(c.req.url).origin + `/share/${linkId}`;

	// Look up the public link
	const linkResult = await db
		.select()
		.from(publicLink)
		.where(eq(publicLink.linkId, linkId))
		.limit(1);

	if (linkResult.length === 0) {
		return c.html(renderNotFoundPage(baseUrl), 404);
	}

	const link = linkResult[0];

	// Check if expired
	if (link.expiresAt < Date.now()) {
		return c.html(renderExpiredPage(baseUrl), 410);
	}

	// Dispatch based on resource type
	if (link.resourceType === "order") {
		// Fetch order data
		const orderResult = await db
			.select({
				id: order.id,
				orderNumber: order.orderNumber,
				status: order.status,
				total: order.total,
			})
			.from(order)
			.where(and(eq(order.id, Number(link.resourceId)), isNull(order.deletedAt)))
			.limit(1);

		if (orderResult.length === 0) {
			return c.html(renderNotFoundPage(baseUrl), 404);
		}

		const orderData = orderResult[0];

		// Fetch order lines
		const lineList = await db
			.select({
				id: orderLine.id,
				quantity: orderLine.quantity,
				unitPrice: orderLine.unitPrice,
				lineTotal: orderLine.lineTotal,
				itemName: item.name,
			})
			.from(orderLine)
			.leftJoin(item, eq(orderLine.itemId, item.id))
			.where(
				and(eq(orderLine.orderId, orderData.id), isNull(orderLine.deletedAt)),
			);

		return c.html(
			renderOrderPage(
				{
					id: orderData.id,
					orderNumber: orderData.orderNumber,
					status: orderData.status,
					total: orderData.total,
					lineList,
				},
				link.expiresAt,
				baseUrl,
			),
		);
	}

	// Unknown resource type
	return c.html(renderNotFoundPage(baseUrl), 404);
});

export { app as publicShareRoute };
