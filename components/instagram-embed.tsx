"use client"

import { useEffect, useRef } from "react"

interface InstagramEmbedProps {
  postUrl: string
  className?: string
}

export function InstagramEmbed({ postUrl, className }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load the Instagram embed script
    if (!document.getElementById("instagram-embed-script")) {
      const script = document.createElement("script")
      script.id = "instagram-embed-script"
      script.src = "//www.instagram.com/embed.js"
      script.async = true
      script.defer = true
      document.body.appendChild(script)

      return () => {
        // Clean up script when component unmounts
        const scriptElement = document.getElementById("instagram-embed-script")
        if (scriptElement) {
          document.body.removeChild(scriptElement)
        }
      }
    } else {
      // If script already exists, process this embed
      if (window.instgrm) {
        window.instgrm.Embeds.process()
      }
    }
  }, [postUrl])

  return (
    <div ref={containerRef} className={className}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={postUrl}
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          borderRadius: "3px",
          boxShadow: "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
          margin: "1px",
          maxWidth: "540px",
          minWidth: "326px",
          padding: 0,
          width: "calc(100% - 2px)",
        }}
      >
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                backgroundColor: "#F4F4F4",
                borderRadius: "50%",
                height: "12.5px",
                width: "12.5px",
                transform: "translateX(0px) translateY(7px)",
              }}
            ></div>
            <div
              style={{
                backgroundColor: "#F4F4F4",
                height: "12.5px",
                transform: "rotate(-45deg) translateX(3px) translateY(1px)",
                width: "12.5px",
                flexGrow: 0,
                marginRight: "14px",
                marginLeft: "2px",
              }}
            ></div>
            <div
              style={{
                backgroundColor: "#F4F4F4",
                borderRadius: "50%",
                height: "12.5px",
                width: "12.5px",
                transform: "translateX(9px) translateY(-18px)",
              }}
            ></div>
          </div>
          <div style={{ marginLeft: "8px" }}>
            <div
              style={{ backgroundColor: "#F4F4F4", borderRadius: "50%", flexGrow: 0, height: "20px", width: "20px" }}
            ></div>
            <div
              style={{
                width: "0",
                height: "0",
                borderTop: "2px solid transparent",
                borderLeft: "6px solid #f4f4f4",
                borderBottom: "2px solid transparent",
                transform: "translateX(16px) translateY(-4px) rotate(30deg)",
              }}
            ></div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div
              style={{
                width: "0px",
                borderTop: "8px solid #F4F4F4",
                borderRight: "8px solid transparent",
                transform: "translateY(16px)",
              }}
            ></div>
            <div
              style={{
                backgroundColor: "#F4F4F4",
                flexGrow: 0,
                height: "12px",
                width: "16px",
                transform: "translateY(-4px)",
              }}
            ></div>
            <div
              style={{
                width: "0",
                height: "0",
                borderTop: "8px solid #F4F4F4",
                borderLeft: "8px solid transparent",
                transform: "translateY(-4px) translateX(8px)",
              }}
            ></div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "#F4F4F4",
              borderRadius: "4px",
              flexGrow: 0,
              height: "14px",
              marginBottom: "6px",
              width: "224px",
            }}
          ></div>
          <div
            style={{ backgroundColor: "#F4F4F4", borderRadius: "4px", flexGrow: 0, height: "14px", width: "144px" }}
          ></div>
        </div>
        <p
          style={{
            color: "#c9c8cd",
            fontFamily: "Arial,sans-serif",
            fontSize: "14px",
            lineHeight: "17px",
            marginBottom: 0,
            marginTop: "8px",
            overflow: "hidden",
            padding: "8px 0 7px",
            textAlign: "center",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <a
            href={postUrl}
            style={{
              color: "#c9c8cd",
              fontFamily: "Arial,sans-serif",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: "normal",
              lineHeight: "17px",
              textDecoration: "none",
            }}
            target="_blank"
            rel="noreferrer noopener"
          >
            Loading Instagram post...
          </a>
        </p>
      </blockquote>
    </div>
  )
}
