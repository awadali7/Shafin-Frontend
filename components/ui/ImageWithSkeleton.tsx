"use client";

import React, { useState } from "react";

interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    alt: string;
    wrapperClassName?: string;
}

export const ImageWithSkeleton: React.FC<ImageWithSkeletonProps> = ({
    alt,
    wrapperClassName = "",
    className = "",
    onLoad,
    onError,
    ...imgProps
}) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={`relative ${wrapperClassName}`}>
            {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                {...imgProps}
                alt={alt}
                className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                onLoad={(e) => {
                    setLoaded(true);
                    onLoad?.(e);
                }}
                onError={(e) => {
                    setLoaded(true);
                    onError?.(e);
                }}
            />
        </div>
    );
};
