/*
flow write by zolad
@2015-6-10 
*/
(function($) {
  var defaults = {
    processData: {}, //步骤节点数据
    //processUrl:'',//步骤节点数据
    fnRepeat: function() {
      alert("步骤连接重复");
    },
    fnClick: function() {
      alert("单击");
    },
    fnDbClick: function() {
      alert("双击");
    },
    canvasMenus: {
      "one": function(t) {
        alert('画面右键')
      }
    },
    processMenus: {
      "one": function(t) {
        alert('步骤右键')
      }
    },
    /*右键菜单样式*/
    menuStyle: {
      border: '1px solid #5a6377',
      minWidth: '150px',
      padding: '5px 0'
    },
    itemStyle: {
      fontFamily: 'verdana',
      color: '#333',
      border: '0',
      /*borderLeft:'5px solid #fff',*/
      padding: '5px 40px 5px 20px'
    },
    itemHoverStyle: {
      border: '0',
      /*borderLeft:'5px solid #49afcd',*/
      color: '#fff',
      backgroundColor: '#5a6377'
    },
    fnAfterDrop: function(params) {
      //alert('连接成功后调用');
      //alert("连接："+params.sourceId +" -> "+ params.targetId);
    },
    //这是连接线路的绘画样式
    connectorPaintStyle: {
      lineWidth: 3,
      strokeStyle: "#49afcd",
      joinstyle: "round"
    },
    //鼠标经过样式
    connectorHoverStyle: {
      lineWidth: 3,
      strokeStyle: "#da4f49"
    }

  }; /*defaults end*/

  /*设置隐藏域保存关系信息*/
  var aConnections = []; //[{sourceId:xx,targetId:xx}]
  var setConnections = function(conn, remove) {
    if (!remove) aConnections.push(conn);
    else {
      var idx = -1;
      for (var i = 0; i < aConnections.length; i++) {
        if (aConnections[i] == conn) {
          idx = i;
          break;
        }
      }
      if (idx != -1) aConnections.splice(idx, 1);
    }
    if (aConnections.length > 0) {
      var s = "";
      for (var j = 0; j < aConnections.length; j++) {
        var from = $('#' + aConnections[j].sourceId).attr('process_id');
        var target = $('#' + aConnections[j].targetId).attr('process_id');
        s = s + "<input type='hidden' value=\"" + from + "," + target + "\">";
      }
      $('#flow_process_info').html(s);
    } else {
      $('#flow_process_info').html('');
    }
    jsPlumb.repaintEverything(); //重画
  };

  /*Flow 命名纯粹为了美观，而不是 formDesign */
  $.fn.Flow = function(options) {
      var _canvas = $(this);
      //右键步骤的步骤号
      _canvas.append('<input type="hidden" id="flow_active_id" value="0"/><input type="hidden" id="flow_copy_id" value="0"/>');
      _canvas.append('<div id="flow_process_info"></div>');


      /*配置 将参数都加入到defaults*/
      $.each(options, function(i, val) {
        if (typeof val == 'object' && defaults[i])
          $.extend(defaults[i], val);
        else
          defaults[i] = val;
      });
      /*画布右键绑定*/
      var contextmenu = {
        bindings: defaults.canvasMenus,
        menuStyle: defaults.menuStyle,
        itemStyle: defaults.itemStyle,
        itemHoverStyle: defaults.itemHoverStyle
      }
      $(this).contextMenu('canvasMenu', contextmenu);

      jsPlumb.importDefaults({
        DragOptions: {
          cursor: 'pointer'
        },
        EndpointStyle: {
          fillStyle: '#225588'
        },
        Endpoint: ["Dot", {
          radius: 1
        }],
        ConnectionOverlays: [
          ["Arrow", {
            location: 1
          }],
          ["Label", {
            location: 0.1,
            id: "label",
            cssClass: "aLabel"
          }]
        ],
        Anchor: 'Continuous',
        ConnectorZIndex: 5,
        HoverPaintStyle: defaults.connectorHoverStyle
      });
      if ($.browser.msie && $.browser.version < '9.0') { //ie9以下，用VML画图
        jsPlumb.setRenderMode(jsPlumb.VML);
      } else { //其他浏览器用SVG
        jsPlumb.setRenderMode(jsPlumb.SVG);
      }

      var _fnMakeStep = function(row) {
        var nodeDiv = document.createElement('div');
        var nodeId = "step" + row.id,
          badge = 'badge-inverse',
          icon = 'icon-star';
        if (row.id == defaults.firstStepId) //第一步
        {
          badge = 'badge-info';
          icon = 'icon-play';
        }
        if (row.icon) {
          icon = row.icon;
        }
        $(nodeDiv).attr("id", nodeId)
          .attr("style", row.style)
          .attr("process_to", row.process_to)
          .attr("process_id", row.id)
          .addClass("process-step btn btn-small")
          .html('<span class="process-flag badge ' + badge + '"><i class="' + icon + ' icon-white"></i></span>&nbsp;' + row.process_name)
          // .append('<div><img src="public/images/flow.png" alt="" /></div>')
          // .append('<div>detail</div>')
          .mousedown(function(e) {
            if (e.which == 3) { //右键绑定
              _canvas.find('#flow_active_id').val(row.id);
              contextmenu.bindings = defaults.processMenus
              $(this).contextMenu('processMenu', contextmenu);
            }
          });
        _canvas.append(nodeDiv);
      };

      //初始化原步骤      
      var processData = defaults.processData;
      if (processData.list) {
        $.each(processData.list, function(i, row) {
          _fnMakeStep(row);
        }); //each
      }

      var timeout = null;
      //点击或双击事件,这里进行了一个单击事件延迟，因为同时绑定了双击事件
      $(".process-step").live('click', function() {
        //激活
        _canvas.find('#flow_active_id').val($(this).attr("process_id")),
          clearTimeout(timeout);
        var obj = this;
        timeout = setTimeout(defaults.fnClick, 300);
      }).live('dblclick', function() {
        clearTimeout(timeout);
        defaults.fnDbClick();
      });

      //使之可拖动
      jsPlumb.draggable(jsPlumb.getSelector(".process-step"));
      var _fnMakeSource = function() {
        $(".process-flag").each(function(i, e) {
          var p = $(e).parent();
          jsPlumb.makeSource($(e), {
            parent: p,
            anchor: "Continuous",
            endpoint: ["Dot", {
              radius: 1
            }],
            connector: ["Flowchart", {
              stub: [5, 5]
            }],
            connectorStyle: defaults.connectorPaintStyle,
            hoverPaintStyle: defaults.connectorHoverStyle,
            dragOptions: {},
            maxConnections: -1
          });
        });
      };
      _fnMakeSource();

      //绑定添加连接操作。画线-input text值  拒绝重复连接
      jsPlumb.bind("jsPlumbConnection", function(info) {
        setConnections(info.connection);
      });
      //绑定删除connection事件
      jsPlumb.bind("jsPlumbConnectionDetached", function(info) {
        setConnections(info.connection, true);
      });
      //绑定删除确认操作
      jsPlumb.bind("click", function(c) {
        if (confirm("你确定取消连接吗?"))
          jsPlumb.detach(c);
      });

      //连接成功回调函数
      function fnAfterDrop(params) {
        //console.log(params)
        defaults.fnAfterDrop && defaults.fnAfterDrop({
          sourceId: $("#" + params.sourceId).attr('process_id'),
          targetId: $("#" + params.targetId).attr('process_id')
        });

      }
      var _fnMakeTarget = function() {
        jsPlumb.makeTarget(jsPlumb.getSelector(".process-step"), {
          dropOptions: {
            hoverClass: "hover",
            activeClass: "active"
          },
          anchor: "Continuous",
          maxConnections: -1,
          endpoint: ["Dot", {
            radius: 1
          }],
          paintStyle: {
            fillStyle: "#ec912a",
            radius: 1
          },
          hoverPaintStyle: this.connectorHoverStyle,
          beforeDrop: function(params) {
            if (params.sourceId == params.targetId) return false; /*不能链接自己*/
            var j = 0;
            var str = $('#' + params.sourceId).attr('process_id') + ',' + $('#' + params.targetId).attr('process_id');
            $('#flow_process_info').find('input').each(function(i) {
              if (str == $(this).val()) {
                j++;
                return;
              }
            })
            if (j > 0) {
              defaults.fnRepeat();
              return false;
            } else {
              fnAfterDrop(params);
              return true;
            }
          }
        });
      };
      _fnMakeTarget();
      //reset  start
      var _fnMakeConnection = function(sSourceId, sProcess_To) {
        var toArr = (sProcess_To || '').split(",");
        var processData = defaults.processData;
        $.each(toArr, function(j, targetId) {

          if (targetId != '' && targetId != 0) {
            //检查 source 和 target是否存在
            var is_source = false,
              is_target = false;
            $.each(processData.list, function(i, row) {
              if (row.id == sSourceId) {
                is_source = true;
              } else if (row.id == targetId) {
                is_target = true;
              }
              if (is_source && is_target)
                return true;
            });

            if (is_source && is_target) {
              jsPlumb.connect({
                source: "step" + sSourceId,
                target: "step" + targetId
                  /* ,labelStyle : { cssClass:"component label" }
                   ,label : id +" - "+ n*/
              });
              return;
            }
          }
        });
      };
      var _fnMakeAllConnection = function() {

          //连接关联的步骤
          $('.process-step').each(function(i) {
            var sourceId = $(this).attr('process_id');
            //var nodeId = "step"+id;
            var prcsto = $(this).attr('process_to');
            _fnMakeConnection(sourceId, prcsto);
          });
        } //_fnMakeAllConnection end reset 
      _fnMakeAllConnection();

      //-----外部调用----------------------

      var Flow = {
        fnMakeAllConnection: _fnMakeAllConnection,
        fnMakeConnection: _fnMakeConnection,
        fnMakeStep: _fnMakeStep,
        fnMakeSource: _fnMakeSource,
        fnMakeTarget: _fnMakeTarget,
        addProcess: function(row) {
          _fnMakeStep(row);
          //使之可拖动 和 连线
          jsPlumb.draggable(jsPlumb.getSelector(".process-step"));
          _fnMakeSource();
          //使可以连接线
          _fnMakeTarget();
          return true;
        },
        addProcessXConnector: function(row) {
          this.addProcess(row);
          var sInput = "<input type='hidden' value=\"" + row.id + "," + row.process_to + "\">";
          $('#flow_process_info').append(sInput);
          //debugger;
          //setConnections([{sourceId:row.id,targetId:row.process_to}]);
          var processData = defaults.processData;
          processData.list = processData.list || [];
          processData.list.push(row);
          _fnMakeConnection(row.id, row.process_to);
        },
        delProcess: function(activeId) {
          if (activeId <= 0) return false;

          $("#step" + activeId).remove();
          return true;
        },
        getActiveId: function() {
          return _canvas.find("#flow_active_id").val();
        },
        copy: function(active_id) {
          if (!active_id)
            active_id = _canvas.find("#flow_active_id").val();

          _canvas.find("#flow_copy_id").val(active_id);
          return true;
        },
        paste: function() {
          return _canvas.find("#flow_copy_id").val();
        },
        getProcessInfo: function() {
          try {
            /*连接关系*/
            var aProcessData = {};
            $("#flow_process_info input[type=hidden]").each(function(i) {
                var processVal = $(this).val().split(",");
                if (processVal.length == 2) {
                  if (!aProcessData[processVal[0]]) {
                    aProcessData[processVal[0]] = {
                      "top": 0,
                      "left": 0,
                      "process_to": []
                    };
                  }
                  aProcessData[processVal[0]]["process_to"].push(processVal[1]);
                }
              })
              /*位置*/
            _canvas.find("div.process-step").each(function(i) { //生成Json字符串，发送到服务器解析
              if ($(this).attr('id')) {
                var pId = $(this).attr('process_id');
                var pLeft = parseInt($(this).css('left'));
                var pTop = parseInt($(this).css('top'));
                if (!aProcessData[pId]) {
                  aProcessData[pId] = {
                    "top": 0,
                    "left": 0,
                    "process_to": []
                  };
                }
                aProcessData[pId]["top"] = pTop;
                aProcessData[pId]["left"] = pLeft;

              }
            })
            return JSON.stringify(aProcessData);
          } catch (e) {
            return '';
          }

        },
        clear: function() {
          try {
            jsPlumb.detachEveryConnection();
            jsPlumb.deleteEveryEndpoint();
            $('#flow_process_info').html('');
            jsPlumb.repaintEverything();
            return true;
          } catch (e) {
            return false;
          }
        },
        refresh: function() {
          try {
            //jsPlumb.reset();
            this.clear();
            _fnMakeAllConnection();
            return true;
          } catch (e) {
            return false;
          }
        }
      };
      return Flow;
    } //endof $.fn.Flow
})(jQuery);