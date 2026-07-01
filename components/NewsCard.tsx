
import React from 'react';
import { NewsItem } from '../types';
import { Icons } from '../constants';
import ApiService from '../services/apiService';

interface NewsCardProps {
  news: NewsItem;
  viewMode?: 'grid' | 'list' | 'minimal';
  onClick: (news: NewsItem) => void;
  searchQuery?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, viewMode = 'grid', onClick, searchQuery = '' }) => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?id=${news.id}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(news.title);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleSocialShare = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        if (navigator.share) {
          navigator.share({ title: news.title, text: news.excerpt, url: shareUrl });
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied!'));
        }
        return;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };


  // Minimal Sidebar Variant
  if (viewMode === 'minimal') {
    return (
      <div
        onClick={() => onClick(news)}
        className="flex gap-4 cursor-pointer group py-2 border-b border-gray-50 last:border-0"
      >
        <div className="w-16 h-16 bg-gray-100 flex-shrink-0 overflow-hidden rounded-sm relative">
          <img src={ApiService.resolveMediaUrl(news.imageUrl)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={news.title} />
          {news.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-[#E31E24] border-b-[4px] border-b-transparent ml-0.5"></div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <h5 className="text-[13px] font-bold line-clamp-2 leading-snug group-hover:text-[#E31E24] transition-colors">{news.title}</h5>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">{news.date}</span>
            {news.viewCount > 0 && <span className="text-[10px] text-gray-400">👁️ {news.viewCount}</span>}
          </div>
        </div>
      </div>
    );
  }

  // Horizontal List Variant - Improved Responsiveness
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick(news)}
        className="flex flex-col sm:flex-row gap-3 md:gap-4 p-2 hover:bg-gray-50 transition-all cursor-pointer group rounded-sm"
      >
        <div className="w-full sm:w-32 md:w-40 h-48 sm:h-24 md:h-28 overflow-hidden rounded-sm relative flex-shrink-0">
          <img
            src={ApiService.resolveMediaUrl(news.imageUrl)}
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
          />
          <div className="absolute top-0 right-0 bg-[#E31E24] text-white text-[8px] px-1.5 py-0.5 font-bold z-20 flex items-center gap-1 shadow-sm">
            <span>👁️</span> {news.viewCount}
          </div>
          {news.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
              <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-[#E31E24] border-b-[6px] border-b-transparent ml-1"></div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
            <button onClick={(e) => handleSocialShare('facebook', e)} className="bg-[#E31E24] text-white p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-all hover:bg-white hover:text-[#E31E24]"><div className="scale-75"><Icons.Facebook /></div></button>
            <button onClick={(e) => handleSocialShare('twitter', e)} className="bg-[#E31E24] text-white p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-all delay-75 hover:bg-white hover:text-[#E31E24]"><div className="scale-75"><Icons.Twitter /></div></button>
          </div>
        </div>
        <div className="flex flex-col flex-grow justify-start py-1">
          <h3 className="text-[15px] md:text-[16px] font-bold mb-1 group-hover:text-[#E31E24] transition-colors leading-tight line-clamp-3">
            {highlightText(news.title, searchQuery)}
          </h3>
          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase mt-auto">
            <span>🕒 {news.date}</span>
            <span>💬 {news.commentCount}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default Grid Variant (Large)
  return (
    <div
      onClick={() => onClick(news)}
      className="bg-white overflow-hidden flex flex-col cursor-pointer group h-full"
    >
      <div className="aspect-[16/10] relative overflow-hidden rounded-sm">
        <img
          src={ApiService.resolveMediaUrl(news.imageUrl)}
          alt={news.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
        />
        <div className="absolute top-0 right-0 bg-[#E31E24] text-white text-[10px] px-2.5 py-1 font-bold z-20 flex items-center gap-1 shadow-md">
          <span className="text-xs">👁️</span> {news.viewCount}
        </div>
        {news.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10 pointer-events-none">
            <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-[#E31E24] border-b-[8px] border-b-transparent ml-1.5"></div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-10">
          <button onClick={(e) => handleSocialShare('facebook', e)} className="bg-white text-[#1877F2] p-2.5 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#E31E24] hover:text-white"><Icons.Facebook /></button>
          <button onClick={(e) => handleSocialShare('twitter', e)} className="bg-white text-[#1DA1F2] p-2.5 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 hover:bg-[#E31E24] hover:text-white"><Icons.Twitter /></button>
          <button onClick={(e) => handleSocialShare('native', e)} className="bg-white text-gray-800 p-2.5 rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-150 hover:bg-[#E31E24] hover:text-white"><Icons.Share /></button>
        </div>
        <div className="absolute top-0 left-0 bg-black/80 text-white text-[9px] px-2 py-1 font-bold uppercase z-20">
          {news.category}
        </div>
      </div>
      <div className="py-4 flex flex-col flex-grow">
        <h3 className="text-base md:text-lg font-bold mb-2 leading-tight group-hover:text-[#E31E24] transition-colors line-clamp-3">
          {highlightText(news.title, searchQuery)}
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold uppercase mt-auto pt-2">
          <span>🕒 {news.date}</span>
          <span>💬 {news.commentCount}</span>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
