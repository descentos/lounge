"use strict";

const $ = require("jquery");

const options = require("./options");
const templates = require("../views");

module.exports = renderPreview;

function renderPreview(preview, msg) {
	if (preview.type === "loading") {
		return;
	}

	const escapedLink = preview.link.replace(/["\\]/g, "\\$&");
	const previewContainer = msg.find(`.preview[data-url="${escapedLink}"]`);

	// This is to fix a very rare case of rendering a preview twice
	// This happens when a very large amount of messages is being sent to the client
	// and they get queued, so the `preview` object on the server has time to load before
	// it actually gets sent to the server, which makes the loaded preview sent twice,
	// once in `msg` and another in `msg:preview`
	if (!previewContainer.is(":empty")) {
		return;
	}

	preview.shown = options.shouldOpenMessagePreview(preview.type);

	const container = msg.closest(".chat");
	let bottom = false;
	if (container.length) {
		bottom = container.isScrollBottom();
	}

	msg.find(`.text a[href="${escapedLink}"]`)
		.first()
		.after(templates.msg_preview_toggle({preview: preview}).trim());

	previewContainer
		.append(templates.msg_preview({preview: preview}));

	if (preview.shown && bottom) {
		handleImageInPreview(msg.find(".toggle-content"), container);
	}

	container.trigger("keepToBottom");
}

$("#chat").on("click", ".toggle-button", function() {
	const self = $(this);
	const container = self.closest(".chat");
	const content = self.closest(".content")
		.find(`.preview[data-url="${self.data("url")}"] .toggle-content`);
	const bottom = container.isScrollBottom();

	if (bottom && !content.hasClass("show")) {
		handleImageInPreview(content, container);
	}

	self.toggleClass("opened");
	content.toggleClass("show");

	// If scrollbar was at the bottom before toggling the preview, keep it at the bottom
	if (bottom) {
		container.scrollBottom();
	}
});

function handleImageInPreview(content, container) {
	const img = content.find("img");

	// Trigger scroll logic after the image loads
	if (img.length && !img.width()) {
		img.on("load", function() {
			container.trigger("keepToBottom");
		});
	}
}

/* Image viewer */

// FIXME Remove #input focus when this is open
// See https://github.com/thelounge/lounge/issues/1342
$("#viewport").on("click", ".toggle-thumbnail", function() {
	const link = $(this);

	openImageViewer(link);

	// Prevent the link to open a new page since we're opening the image viewer,
	// but keep it a link to allow for Ctrl/Cmd+click
	return false;
});

$("#image-viewer").on("click", function() {
	closeImageViewer();
});

$(document).keydown(function(e) {
	switch (e.keyCode ? e.keyCode : e.which) {
	case 27: // Escape
		closeImageViewer();
		break;
	case 37: // Left arrow
		if ($(document.body).hasClass("image-viewer-opened")) {
			$("#image-viewer .previous-image-btn").click();
		}
		break;
	case 39: // Right arrow
		if ($(document.body).hasClass("image-viewer-opened")) {
			$("#image-viewer .next-image-btn").click();
		}
		break;
	}
});

function openImageViewer(link) {
	$(".previous-image").removeClass("previous-image");
	$(".next-image").removeClass("next-image");

	// The next two blocks figure out what are the previous/next images. We first
	// look within the same message, as there can be multiple thumbnails per
	// message, and if not, we look at previous/next messages and take the
	// last/first thumbnail available.
	// Only expanded thumbnails are being cycled through.

	// Previous image
	let previousCandidates = link.closest(".preview").prev(".preview");
	if (!previousCandidates.length) {
		previousCandidates = link.closest(".msg").prevAll();
	}
	const previousImage = previousCandidates
		.find(".toggle-content.show .toggle-thumbnail").last();
	previousImage.addClass("previous-image");

	// Next image
	let nextCandidates = link.closest(".preview").next(".preview");
	if (!nextCandidates.length) {
		nextCandidates = link.closest(".msg").nextAll();
	}
	const nextImage = nextCandidates
		.find(".toggle-content.show .toggle-thumbnail").first();
	nextImage.addClass("next-image");

	$("#image-viewer").html(templates.image_viewer({
		image: link.find("img").attr("src"),
		link: link.attr("href"),
		type: link.parent().hasClass("toggle-type-image") ? "image" : "link",
		hasPreviousImage: previousImage.length > 0,
		hasNextImage: nextImage.length > 0,
	}));

	$(document.body).addClass("image-viewer-opened");
}

$("#image-viewer").on("click", ".previous-image-btn", function() {
	$(".previous-image").click();
	return false;
});

$("#image-viewer").on("click", ".next-image-btn", function() {
	$(".next-image").click();
	return false;
});

function closeImageViewer() {
	$(document.body)
		.removeClass("image-viewer-opened")
		.one("transitionend", function() {
			$("#image-viewer").empty();
		});
}
