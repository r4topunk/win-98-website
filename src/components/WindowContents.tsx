import React, { useState } from "react";

interface WindowContentsProps {
  iconType: string;
}

export function WindowContents({ iconType }: WindowContentsProps) {
  const [count, setCount] = useState(0);

  // Different content based on which icon was clicked
  switch (iconType) {
    case "Movies":
      return (
        <div className="p-2">
          <h4>My Movies</h4>
          <div className="field-row">
            <ul className="tree-view">
              <li>Action</li>
              <li>Comedy</li>
              <li>Drama</li>
              <li>Horror</li>
            </ul>
          </div>
        </div>
      );

    case "Images":
      return (
        <div className="p-2">
          <h4>My Images</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-200 h-16 flex items-center justify-center">
              Image 1
            </div>
            <div className="bg-gray-200 h-16 flex items-center justify-center">
              Image 2
            </div>
            <div className="bg-gray-200 h-16 flex items-center justify-center">
              Image 3
            </div>
            <div className="bg-gray-200 h-16 flex items-center justify-center">
              Image 4
            </div>
          </div>
        </div>
      );

    case "Computer":
      return (
        <div className="p-2">
          <h4>My Computer</h4>
          <div className="field-row">
            <ul className="tree-view">
              <li>Local Disk (C:)</li>
              <li>CD Drive (D:)</li>
              <li>Network (Z:)</li>
            </ul>
          </div>
        </div>
      );

    case "Counter":
      return (
        <div className="p-2">
          <p style={{ textAlign: "center" }}>Current count: {count}</p>
          <div className="field-row" style={{ justifyContent: "center" }}>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(count - 1)}>-</button>
            <button onClick={() => setCount(0)}>0</button>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-2">
          <h4>{iconType}</h4>
          <p>Content for {iconType} window</p>
          <div className="field-row">
            <button>OK</button>
            <button>Cancel</button>
          </div>
        </div>
      );
  }
}
