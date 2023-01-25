import { JetView } from "webix-jet";
import { getFileByTaskId, getMyTask, getTaskById, imgTemplate, state, uploadByTaskId } from "../../../models/Task";
import { getProjectById, state as stateProject } from "../../../models/Project";
import { BACKEND_URL } from "../../../config/config";
import { getDateFormatted } from "../../../helpers/ui";
import {
  createComment,
  getAllComment,
  removeComment,
  state as stateComment,
  updateComment,
} from "../../../models/Comment";
import { TaskAttachScreenshot } from "./TaskAttachScreenshot";
import { TaskPhotoPreview } from "./TaskPhotoPreview";

const prefix = state.prefix + "_detail_";
const prefixAttach = state.prefix + "_attachscreen_";

function backToGrid(_this) {
  const backRoute = `m.task?project_id=${stateProject.selId}`;
  _this.show(backRoute);
}


async function loadFiles() {
  const images = await getFileByTaskId(state.selId);
  const fileId = $$(prefix + "file_view");
  if (images.length > 0) {
    $$(prefix + "file_view_empty").hide();
    $$(prefix + "file_view_panel").show();
    $$(prefix + "file_view").show();
    fileId.clearAll();
    fileId.parse(images);
    state.images = images;
    var viewsArray = [];
    for (var i = 0; i < images.length; i++) {
      viewsArray.push({
        id: images[i].id,
        css: "image",
        template: imgTemplate,
        data: webix.copy(images[i]),
      });
    }

    state.imageView = viewsArray;
  } else {
    $$(prefix + "file_view_empty").show();
    $$(prefix + "file_view_panel").hide();
    $$(prefix + "file_view").hide();
  }
  return null;
}


function clearComments() {
  $$(prefix + "comment_text").setValue();
  stateComment.dataSelected = {};
}

function removeCommentById(selId) {
  webix.confirm({
    ok: "Yes",
    cancel: "No",
    text: "Are you sure to delete ?",
    callback: function (result) {
      if (result) {
        removeComment(selId).then((_) => {
          webix.message({
            text: "Comment deleted",
            type: "success",
          });
          loadComments();
          clearComments();
        });
      }
    },
  });
}


async function loadComments() {
  const comments = await getAllComment(state.selId);
  const commentListId = $$(prefix + "comment_list");
  stateComment.dataComments = comments;
  let outputHtml = "";
  comments.forEach((obj) => {
    outputHtml += `<div class='comment_list_panel'>${
      obj.name
    } <span style='color:grey'>create at: ${getDateFormatted(
      obj.date_creation
    )} update at: ${getDateFormatted(obj.date_modification)}</span><br>
    <div class='comment_list_msg'><span class='comment_msg'>${
      obj.comment
    }</span>
    <span class='action-icon'>
      <span class='webix_icon mdi mdi-pencil update-icon' title='Update' data-comment_id=${
        obj.id
      }></span>
      <span class='webix_icon mdi mdi-close remove-icon' title='Delete' data-comment_id=${
        obj.id
      }></span>
    </span>
    </div>
    </div>`;
  });
  commentListId.setHTML(outputHtml);
  commentListId.scrollTo(0, 1000);
}

export default class TaskDetailMobile extends JetView {
  config() {
    const toolbar = {
      view: "toolbar",
      elements: [
        { width: 10 },
        {
          view: "icon",
          icon: "mdi mdi-arrow-left",
          click: () => {
            backToGrid(this);
          },
        },
        {
          view: "label",
          label: " Task",
          id: prefix + "navbar",
        },
        {},
      ],
    };

    const taskPanel = {
      rows: [
        {
          view: "template",
          id: prefix + "task_view",
          // height: 60,
          autoheight: true,
          template: function (obj) {
            if (Object.keys(obj).length !== 0 && obj.constructor === Object) {
              return `<div class='task_view_template' style='background:${obj.color.background}'><div class='task_view__title'>${obj.title}</div> Description: ${obj.description}, creator: ${obj.creator_id}</div>`;
            }
            return "";
          },
        },
        {
          type: "clean",
          css: "task_action",
          cols: [
            {
              view: "button",
              autowidth: true,
              type: "icon",
              icon: "mdi mdi-pencil",
              tooltip: "Edit",
              css: { "padding-right": "10px" },
              click: function () {
                this.$scope.show(
                  `m.task.edit?project_id=${stateProject.selId}&id=${state.selId}`
                );
              },
            },
            {
              view: "button",
              autowidth: true,
              type: "icon",
              icon: "mdi mdi-attachment",
              tooltip: "Attachement",
              css: { "padding-right": "10px" },
              click: function () {
                this.$scope.ui(TaskAttachScreenshot).show();
              },
            },
            {},
          ],
        },
        {
          id: prefix + "file_view_panel",
          height: 100,
          hidden: true,
          cols: [
            {
              width: 130,
              id: prefix + "file_attach_panel",
              hidden: true,
              cols: [
                { width: 10, css: "white_background" },
                {
                  rows: [
                    {
                      view: "photo",
                      name: "photo",
                      css: "form_photo",
                      id: "form_photo",
                      borderless: false,
                      width: 120,
                      height: 65,
                    },
                    {
                      view: "button",
                      label: "Upload",
                      css: "webix_primary",
                      click: function () {
                        let imageBase64 = $$("form_photo").getValue();

                        const fileName =
                          state.fileNameUpload || `${new Date().valueOf()}.png`;
                        imageBase64 = imageBase64.replace(
                          "data:image/png;base64,",
                          ""
                        );
                        imageBase64 = imageBase64.replace(" ", "+");

                        uploadByTaskId(
                          stateProject.selId,
                          state.selId,
                          fileName,
                          imageBase64
                        ).then((_) => {
                          loadFiles().then((_) => {
                            $$(prefix + "file_attach_panel").hide();
                          });
                        });
                      },
                    },
                  ],
                },
                { width: 10, css: "white_background" },
              ],
            },
            { id: prefix + "file_view_empty", css: "white_background" },
            {
              view: "dataview",
              id: prefix + "file_view",
              height: 100,
              xCount: 4,
              select: true,
              hidden: true,
              type: {
                height: 100,
                width: "auto",
              },
              template: `<div style='background-image:url(${BACKEND_URL}/data/files/thumbnails/#path#);height:100px;background-repeat:no-repeat;background-position:center;background-size:contain;object-fit: contain;position: relative;'>
              <div class='item-click' style='width:85%;height:100%;float:left;'></div>
              <div class='webix_icon mdi mdi-close remove-file-icon' style='float:right;width:5%;height:20px;z-index:1000;padding:10px' title='Delete'></div>
              </div>
              `,
              onClick: {
                "item-click": function (e, id, node) {
                  e.preventDefault();
                  this.$scope.ui(TaskPhotoPreview).show();
                },
                "remove-file-icon": function (e, id, node) {
                  e.preventDefault();
                  removeFileById(id);
                },
              },
            },
          ],
        },
        // end view_file_panel
        {
          view: "template",
          template: "Comments",
          type: "section",
          css: { background: "#fff" },
        },
        // end template section comment
        {
          padding: 10,
          css: { background: "#fff" },
          rows: [
            {
              view: "textarea",
              id: prefix + "comment_text",
              height: 100,
            },
            {
              cols: [
                {
                  view: "button",
                  label: "Submit",
                  autowidth: true,
                  css: "webix_primary",
                  click: function () {
                    const commentViewId = $$(prefix + "comment_list");
                    const obj = stateComment.dataSelected;
                    if (
                      Object.keys(obj).length !== 0 &&
                      obj.constructor === Object
                    ) {
                      updateComment(
                        obj.id,
                        $$(prefix + "comment_text").getValue()
                      ).then((_) => {
                        webix.message({
                          text: "Comment updated",
                          type: "success",
                        });
                        loadComments();
                        clearComments();
                        $$(prefix + "cancel_edit_comment").hide();
                      });
                    } else {
                      createComment(
                        state.selId,
                        userProfile.userId,
                        $$(prefix + "comment_text").getValue()
                      ).then((r) => {
                        webix.message({
                          text: "Comment saved",
                          type: "success",
                        });
                        loadComments();
                        clearComments();
                        $$(prefix + "cancel_edit_comment").hide();
                      });
                    }
                  },
                },
                {
                  view: "button",
                  label: "Cancel",
                  id: prefix + "cancel_edit_comment",
                  hidden: true,
                  autowidth: true,
                  click: function () {
                    stateComment.dataSelected = {};
                    $$(prefix + "comment_text").setValue();
                    this.hide();
                  },
                },
                {},
              ],
            },
            { height: 20 },
          ],
        },
        // end comment text
        {
          id: prefix + "comment_list",
          view: "template",
          css: "comment_list",
          scroll: "y",
          onClick: {
            "update-icon": function (e, id, node) {
              const selId = parseInt(node.dataset.comment_id);
              const item = stateComment.dataComments.find((e) => e.id == selId);
              stateComment.dataSelected = item;
              const commentTxtId = $$(prefix + "comment_text");
              commentTxtId.setValue(item.comment);
              commentTxtId.focus();
              $$(prefix + "cancel_edit_comment").show();

              webix.html.addCss(
                commentTxtId.getNode(),
                "flash_hightlight_comment"
              );
              setTimeout(() => {
                webix.html.removeCss(
                  commentTxtId.$view,
                  "flash_hightlight_comment"
                );
              }, 1000);
            },
            "remove-icon": function (e, id, node) {
              const selId = parseInt(node.dataset.comment_id);
              removeCommentById(selId);
            },
          },
        },
        // end comment list
      ],
    };

    return {
      rows: [toolbar, taskPanel],
    };
  }
  init(view) {}
  urlChange(view, url) {
    stateProject.selId = url[0].params.project_id;
    state.selId = url[0].params.id;
    state.attachOpen = url[0].params.attach || 0;
    if(state.attachOpen && !$$(prefixAttach + "win")){
      view.$scope.ui(TaskAttachScreenshot).show();
    }
  }

  async ready(view, url) {
    stateProject.selId = url[0].params.project_id;
    state.selId = url[0].params.id;
    state.attachOpen = url[0].params.attach || 0;

    const task = await getTaskById(state.selId);
    const taskViewId = $$(prefix + "task_view");

    taskViewId.parse(task);
    taskViewId.refresh();

    await loadComments();

    await loadFiles();

    if(state.attachOpen && !$$(prefixAttach + "win")){
      view.$scope.ui(TaskAttachScreenshot).show();
    }
  }
}
