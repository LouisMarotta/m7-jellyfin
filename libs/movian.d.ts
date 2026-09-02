declare module "movian" {
    global {
        interface Console {
            /**
             * Logs a message to the console
             * @param msg - The message to log
             */
            log(msg: string): void;
            
            /**
             * Logs an error message to the console
             * @param msg - The error message to log
             */
            error(msg: string): void;
        }

        interface Plugin {
            /** Unique identifier for plugin */
            readonly id: string;
            
            /** URL where plugin is hosted */
            readonly url: string;
            
            /** Plugin manifest content */
            readonly manifest: string;
            
            /** API version plugin supports */
            readonly apiversion: number;
            
            /** Filesystem path to the plugin */
            readonly path: string;
            
            /** Plugin title for display */
            readonly title?: string;
            
            /** Plugin icon for display */
            readonly icon?: string;
            
            /** Plugin synopsis/description */
            readonly synopsis?: string;
            
            /** Showtime version requirement */
            readonly showtimeVersion?: string;
            
            /** Plugin category (video, audio, etc.) */
            readonly category?: string;
        }

        /**
         * Metadata binding functions
         * Based on Movian source: src/ecmascript/es_metadata.c:119-123
         */
        interface MetadataAPI {
            /**
             * Binds video metadata to an item for history tracking
             * @param root - Root property of the item
             * @param canonicalUrl - Canonical URL for the content
             */
            bindPlayInfo(root: any, canonicalUrl: string): void;
            
            /**
             * Binds video metadata to an item
             * @param root - Root property of the item
             * @param metadata - Video metadata object
             */
            videoMetadataBind(root: any, metadata: any): void;
        }
    }

    /**
     * Parameters for video content
     * Based on Movian source: src/metadata/playinfo.c and video/video_playback.c:195-284
     */
    interface VideoParams {
        /** Title of the video */
        title?: string;
        
        /** Icon/thumbnail URL for the video */
        icon?: string;
        
        /** Disable filesystem scanning for this video */
        no_fs_scan?: boolean;
        
        /** Disable subtitle scanning for this video */
        no_subtitle_scan?: boolean;
        
        /** Canonical URL for the video - Used by Movian for history tracking */
        canonicalUrl?: string;
        
        /** Available video sources */
        sources?: VideoSource[];
        
        /** Available subtitles */
        subtitles?: VideoSubtitle[];
        
        /** IMDb ID for the video */
        imdbid?: string;
        
        /** Release year of the video */
        year?: number;
        
        /** Season number (for TV shows) */
        season?: number;
        
        /** Episode number (for TV shows) */
        episode?: number;
        
        /** Audio track configuration */
        audioTrack?: string;
        
        /** Subtitle track configuration */
        subtitleTrack?: string;
        
        /** Custom metadata fields */
        customFields?: { [key: string]: any };
    }

    /**
     * Video source information
     * Based on Movian source: backend/bittorrent/bt_backend.c:223-246
     */
    interface VideoSource {
        /** URL to the video stream */
        url: string;
        
        /** Bitrate of the video stream (in kbps) */
        bitrate?: number;
        
        /** MIME type of the video stream */
        mimetype?: string;
        
        /** Stream resolution information */
        width?: number;
        
        /** Stream height information */
        height?: number;
        
        /** Audio track information */
        audio?: {
            /** Audio track URL */
            url?: string;
            
            /** Audio track language */
            language?: string;
            
            /** Audio track title */
            title?: string;
            
            /** Audio track codec */
            codec?: string;
        };
        
        /** Subtitle track information */
        subtitle?: {
            /** Subtitle track URL */
            url?: string;
            
            /** Subtitle track language */
            language?: string;
            
            /** Subtitle track title */
            title?: string;
            
            /** Subtitle track codec */
            codec?: string;
            
            /** Source of the subtitle track */
            source?: string;
        };
    }

    /**
     * Video subtitle information
     */
    interface VideoSubtitle {
        /** Title of the subtitle track */
        title: string;
        
        /** URL to the subtitle file */
        url: string;
        
        /** Language of the subtitle track */
        language?: string;
        
        /** Source of the subtitle track */
        source?: string;
    }

    /**
     * KVStore API for key-value storage
     * Based on Movian source: src/ecmascript/es_kvstore.c and src/db/kvstore.h
     */
    interface KVStoreAPI {
        /**
         * Gets a string value from KVStore
         * @param canonicalUrl - Canonical URL key
         * @param domain - Storage domain ('plugin' only for plugins)
         * @param key - Key name
         * @returns String value or null if not found
         */
        getString(canonicalUrl: string, domain: string, key: string): string | null;
        
        /**
         * Gets an integer value from KVStore
         * @param canonicalUrl - Canonical URL key
         * @param domain - Storage domain ('plugin' only for plugins)
         * @param key - Key name
         * @param defaultValue - Default value if not found
         * @returns Integer value
         */
        getInteger(canonicalUrl: string, domain: string, key: string, defaultValue: number): number;
        
        /**
         * Gets a boolean value from KVStore
         * @param canonicalUrl - Canonical URL key
         * @param domain - Storage domain ('plugin' only for plugins)
         * @param key - Key name
         * @param defaultValue - Default value if not found
         * @returns Boolean value
         */
        getBoolean(canonicalUrl: string, domain: string, key: string, defaultValue: boolean): boolean;
        
        /**
         * Sets a value in KVStore
         * @param canonicalUrl - Canonical URL key
         * @param domain - Storage domain ('plugin' only for plugins)
         * @param key - Key name
         * @param value - Value to store (string, number, boolean, or null to delete)
         */
        set(canonicalUrl: string, domain: string, key: string, value: any): void;
    }

    /**
     * KVStore domain constants
     * Based on Movian source: src/db/kvstore.h:32-34
     */
    interface KVStoreDomains {
        /** System domain - read-only for plugins (playcount, lastplayed, restartposition) */
        SYS: 'sys';
        
        /** Plugin domain - read/write for plugins */
        PLUGIN: 'plugin';
        
        /** Property domain - item properties */
        PROP: 'prop';
        
        /** Settings domain - plugin settings */
        SETTING: 'setting';
    }
}
