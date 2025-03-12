import React, { useState, useRef, useEffect } from "react";
import { Input, Button, Avatar, Spin, Tooltip, message } from "antd";
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  CopyOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import user from "@/worker/user";
import api from "@/worker/api";

// 使用 Tailwind CSS 进行样式设计

const relatedInfo = {}
const ChatComponent = ({ className, data, onSendMessage }) => {
  const figureCount = useRef(0)
  const [messages, setMessages] = useState(data);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 模拟发送消息给 LLM 并获取回复
  const sendMessage = async () => {
    if (!input.trim()) return;

    setInput("");
    setLoading(true);

    try {
      await onSendMessage(input.trim());
    } catch (error) {
      console.error("Error fetching response:", error);
      // 可以添加错误消息到对话中
    } finally {
      setLoading(false);
    }
  };

  // 复制消息内容并显示提示
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    message.success("内容已复制到剪贴板");
  };

  

const fetchParaInfo = async (paraId, index_name, message_index) => {
  try {
    let url = `${api.BASE_URL}/report/para/${index_name}/${paraId}`

    if (paraId.startsWith("hb_") && index_name == 'yanbao_zs_20250110') {
      url = `${api.BASE_URL}/report/para/newyanbao_main/${paraId}`
    }
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${user.token}`
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.data) {
      const obj = data.data;
      setMessages(his => [...his])
      return {
        title: obj.title,
        para: obj.para,
        doc_id: obj.doc_id,
        page_num: obj.page_num,
        dom: `<small class="text-xs"> From <span class="text-gray-400 cursor-pointer hover:text-gray-500" onclick="relatedOnClick('${
          obj.doc_id
        }', '${paraId}', ${obj.page_num}, ${message_index}, { x: ${
          obj.para_element_x
        }, y: ${obj.para_element_y}, w: ${obj.para_element_w}, h: ${
          obj.para_element_h
        }}, '${obj.title}')">《${obj.title}》</span> ${obj.doc_date} Page ${
          obj.page_num + 1
        }</small>`,
        img_dom: ""
      };
    }
  } catch (error) {
    console.error("fetchParaInfo error", paraId, error);
    return null;
  }
};

const fetchTableInfo = async (tableId, count, index_name, message_index) => {
  try {
    const response = await fetch(`${api.BASE_URL}/report/table_info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        index_name,
        collection_name: index_name,
        query: tableId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let obj = data.data[0];

    if (obj) {
      setMessages(his => [...his])
      const onclick = `relatedOnClick('${obj.doc_id}', '${tableId}', ${obj.page_num}, ${message_index}, { x: ${obj.para_element_x}, y: ${obj.para_element_y}, w: ${obj.para_element_w}, h: ${obj.para_element_h}}, '${obj.title}')`;
      return {
        title: obj.title,
        para: obj.para,
        doc_id: obj.doc_id,
        page_num: obj.page_num,
        dom: `<div class="img-title text-xs inline">【表${count}】：<span class="text-gray-400 cursor-pointer hover:text-gray-500" onclick="${onclick}">《${
          obj.title
        }》</span> ${obj.doc_date} 第${
          obj.page_num + 1
        }页</div>`,
        img_dom: `<img title="点击图片可以查看图片来源" onclick="${onclick}" src="${
          api.BASE_URL
        }/table_figure/${index_name}/${tableId}" />`
      };
    }
  } catch (e) {
    console.error("fetchTableInfo error", tableId, e);
  }
  return null;
};

const fetchFigureInfo = async (figureId, count, index_name, message_index) => {
  try {
    const response = await fetch(`${api.BASE_URL}/report/figure_info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        query: figureId,
        index_name,
        collection_name: index_name,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data) {
      setMessages(his => [...his])
      const obj = data.data[0];
      const onclick = `relatedOnClick('${obj.doc_id}', '${figureId}', ${
        obj.page_num
      }, ${message_index}, { x: ${obj.para_element_x}, y: ${
        obj.para_element_y
      }, w: ${obj.para_element_w}, h: ${
        obj.para_element_h
      }}, '${obj.title.replace(/(\d{2})(\d{2})(\d{2})$/gm, "$1/$2/$3")}')`;
      return {
        title: obj.title,
        para: obj.para,
        doc_id: obj.doc_id,
        page_num: obj.page_num,
        dom: `<div class="img-title text-xs inline">【图${count}】：<span class="text-gray-400 cursor-pointer hover:text-gray-500" onclick="${onclick}">《${obj.title.replace(
          /(\d{2})(\d{2})(\d{2})$/gm,
          "$1/$2/$3"
        )}》</span> ${obj.doc_date} 第${
          obj.page_num + 1
        }页</div>`,
        img_dom: `<img title="点击图片可以查看图片来源" data-src="${
          data.image
        }" onclick="${onclick}"/>`
      };
    }
  } catch (error) {
    console.error("fetchFigureInfo error", figureId, error);
    return null;
  }
};

  const getRelatedInfo = (msg, index_name, message_index) => {
    if (msg in relatedInfo) {
      if (relatedInfo[msg].is_over) {
        return relatedInfo[msg].data;
      }
      return null
    }

    if (msg.startsWith("para-")) {
      const paraId = msg.slice(5);
      if (!(msg in relatedInfo)) {
        relatedInfo[msg] = { is_over: false };
        fetchParaInfo(paraId, index_name, message_index).then((info) => {
          if (info) {
            relatedInfo[msg] = { is_over: true, data: info };
          }
        });
      }
    }

    if (msg.startsWith("table-")) {
      const tableId = msg.slice(6);
      if (!(msg in relatedInfo)) {
        relatedInfo[msg] = { is_over: false };
        tableCount.value++;
        fetchTableInfo(tableId, tableCount.value, index_nam, message_index).then((info) => {
          if (info) {
            relatedInfo[msg] = { is_over: true, data: info };
          }
        });
      }
    }

    if (msg.startsWith("figure-")) {
      const figureId = msg.slice(7);
      if (!(msg in relatedInfo)) {
        relatedInfo[msg] = { is_over: false };
        figureCount.current++;
        fetchFigureInfo(figureId, figureCount.current, index_name, message_index).then((info) => {
          if (info) {
            relatedInfo[msg] = { is_over: true, data: info };
          }
        });
      }
    }

    if (!(msg in relatedInfo)) {
      relatedInfo[msg] = {
        is_over: true,
        data: {
          title: msg,
          para: msg,
          doc_id: msg,
          page_num: msg,
        },
      };
    }
    return null;
  };

  const customMarked = (item, message_index) => {
    let text = item.content;
    const name_map = new Map();
    if ('short_id_mapping' in item) {
      item.short_id_mapping.forEach((item) => {
        name_map.set(item[0], item[1]);
      });
    }
    if (text.indexOf("<think>") != -1 && text.indexOf("</think>") == -1) {
      text += "</think>";
    }
    text = text.replace("<think>", "<div id='think'>");
    text = text.replace("</think>", "</div>");

    const img_num = {};

    text = text.replace(/\[?\[([\w-{}]+)\]?\]/g, (match, p1) => {
      p1 = p1.replace("{", "");
      p1 = p1.replace("}", "");
      try {
        if (name_map.has(p1)) {
          p1 = name_map.get(p1);
        }
      } catch (err) {
        console.log(err);
      }

      const related_info = getRelatedInfo(p1, item.index_name, message_index);
      if (!related_info) {
        return "";
      }

      let ret_dom = related_info.dom;

      if (p1.startsWith("table") || p1.startsWith("figure")) {
        if (!(p1 in img_num)) {
          img_num[p1] = 1;
        } else {
          img_num[p1]++;
        }
        if (img_num[p1] > 1) {
          const id = `${p1}_${img_num[p1]}`;
          if (show_img_id.indexOf(id) != -1) {
            ret_dom =
              ret_dom +
              `<span class="text-xs ml-1" onclick="setShowImgId('${id}')">▼</span>` +
              related_info.img_dom;
          } else {
            ret_dom =
              ret_dom +
              `<span class="text-xs ml-1" onclick="setShowImgId('${id}')">◄</span>`;
          }
        } else {
          ret_dom = ret_dom + related_info.img_dom;
        }
      }
      return ret_dom || '';
    });

    text = text.replace(/\[\[([\w-{}]+)/g, (match, p1) => {
      return "";
    });

    const regex = /<\/?del>/gi;
    text = text.replace(regex, "~");

    return text;
  };

  // 处理按键事件（Enter 发送消息）- 更新为React 18兼容写法
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /**
   * 格式化ISO格式的时间字符串
   * @param {string} isoTimeString - ISO格式的时间字符串，如"2025-03-12T13:18:52.358516"
   * @param {string} format - 输出格式，默认为"YYYY-MM-DD HH:mm:ss"
   * @returns {string} 格式化后的时间字符串
   */
  function formatTime(isoTimeString, format = "YYYY-MM-DD HH:mm:ss") {
    // 创建日期对象
    const date = new Date(isoTimeString);

    // 获取日期的各个部分
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

    // 替换格式字符串中的占位符
    return format
      .replace("YYYY", year)
      .replace("MM", month)
      .replace("DD", day)
      .replace("HH", hours)
      .replace("mm", minutes)
      .replace("ss", seconds)
      .replace("SSS", milliseconds);
  }

  useEffect(() => {
    setMessages(data || []);
  }, [data]);

  return (
    <div className={`flex flex-col bg-gray-50 h-full ${className}`}>
      {/* 对话历史区域 */}
      <div
        className={`flex-1 p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
          messages.length !== 0 ? "overflow-y-auto" : "overflow-y-hidden"
        }`}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <RobotOutlined className="text-5xl mb-3" />
              <p>开始一个新对话吧</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                <div className="flex items-center mb-2">
                  <Avatar
                    icon={
                      message.role === "user" ? (
                        <UserOutlined />
                      ) : (
                        <RobotOutlined />
                      )
                    }
                    className={
                      message.role === "user" ? "bg-blue-700" : "bg-green-500"
                    }
                  />
                  <span className="ml-2 font-medium">
                    {message.role === "user" ? "你" : "AI 助手"}
                  </span>
                  <span className="ml-2 text-xs opacity-70">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.documents && <div className="ml-auto inline-block bg-amber-600 text-white rounded-md px-2 w-auto text-sm">检索到相关文档: {message.documents.length}</div>}
                </div>


                <div
                  className={`prose max-w-none ${
                    message.role === "user" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  ) : (
                    <ReactMarkdown
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              wrapLines={true}
                              showLineNumbers={true}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className={`${className} px-1 py-0.5 rounded bg-gray-100 text-gray-800`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        span(props) {
                          const onclick = props.onClick
                          return <span {...props} onClick={() => eval(onclick)} />
                        },
                        img(props) {
                          return <img onClick={() => eval(props.onClick)} src={props['data-src']} />
                        }
                      }}
                    >
                      {customMarked(message, index)}
                    </ReactMarkdown>
                  )}
                </div>

                <div className="flex justify-end mt-2 space-x-2">
                  <Tooltip title="复制">
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyMessage(message.content)}
                      className={`hover:opacity-80 transition-opacity ${
                        message.role === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    />
                  </Tooltip>
                  {/* <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => deleteMessage(index)}
                      className={`hover:opacity-80 transition-opacity ${
                        message.role === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    />
                  </Tooltip> */}
                </div>
              </div>
            </div>
          ))
        )}

        {/* {loading && (
          <div className="flex justify-start">
            <div className="max-w-3xl rounded-lg p-4 bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <Avatar icon={<RobotOutlined />} className="bg-green-500" />
                <span className="ml-2">AI 助手正在思考</span>
                <Spin className="ml-2" size="small" />
              </div>
            </div>
          </div>
        )} */}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="max-w-4xl mx-auto">
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress} // React 18中使用onKeyDown替代onKeyPress
            placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">支持 Markdown 格式</span>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-blue-500 hover:bg-blue-600 transition-colors"
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
