import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/context/useCart';
import { buildHeroSlides, HERO_IMAGES } from '@/lib/heroImages';
import { getStorefrontSettings } from '@/lib/normalizeApi';
import { useAuth } from '@/lib/context/useAuth';
import type { Store } from '@/types/store';
import { ReferenceIcon } from './ReferenceIcon';
import { MarketplaceBrand, Photo } from './ReferenceUI';
import './reference-marketplace.css';

export function ReferenceStoreHeader({store,onSearch,dineInMode=false,isFood=false,isService=false,showCart=true}:{store:Store;onSearch?:(value:string)=>void;dineInMode?:boolean;isFood?:boolean;isService?:boolean;showCart?:boolean}){
  const {totals,toggleCart}=useCart();const {isAuthenticated,isCustomer}=useAuth();const [search,setSearch]=useState('');
  return <header className="reference-store-header"><div className="reference-market-container"><div className="reference-store-masthead"><Link to="/" aria-label="Back to GeePay Marketplace"><ReferenceIcon name="back"/></Link><Link to="/"><MarketplaceBrand/></Link><span className="reference-store-location"><ReferenceIcon name="pin" size={17}/>{store.city||store.branch_name||store.name}</span><Link to={isCustomer?'/account':isAuthenticated?'/portal':'/login'} aria-label="Your account"><ReferenceIcon name="user"/></Link>{showCart&&<button type="button" className="reference-icon-button" onClick={()=>toggleCart(true)} aria-label={`Open shopping bag, ${totals.itemCount} items`}><ReferenceIcon name="cart" size={27}/>{totals.itemCount>0&&<span className="reference-count">{totals.itemCount}</span>}</button>}</div><form className="reference-market-search" role="search" onSubmit={event=>{event.preventDefault();onSearch?.(search.trim());document.getElementById('shop')?.scrollIntoView({block:'start'});}}><ReferenceIcon name="search"/><label className="sr-only" htmlFor="reference-store-search">Search {store.name}</label><input id="reference-store-search" type="search" maxLength={120} value={search} onChange={event=>{setSearch(event.target.value);onSearch?.(event.target.value.trim());}} placeholder={isFood||dineInMode?'Search the menu...':isService?'Search services...':'Search products...'}/><button aria-label="Search store" type="submit"><ReferenceIcon name="arrow"/></button></form><nav className="reference-store-section-links" aria-label="Store sections"><a href="#shop">{isFood?'Menu':isService?'Services':'Shop'}</a>{!dineInMode&&<><a href="#bestsellers">Featured</a><a href="#about">About</a></>}</nav></div></header>;
}

export function ReferenceStoreHero({store}:{store:Store}){
  const settings=getStorefrontSettings(store);const slides=buildHeroSlides(store);const [index,setIndex]=useState(0);const current=slides[index%Math.max(1,slides.length)];
  return <section className="reference-market-container reference-store-hero-wrap"><div className="reference-store-hero"><div><p className="reference-store-eyebrow">Your GeePay storefront</p><h1>{settings.hero_headline||store.name}</h1><p>{settings.hero_tagline||store.description||'Explore the catalogue and choose what works for you.'}</p><a href="#shop">{settings.cta_label||'Explore catalogue'}<ReferenceIcon name="arrow"/></a></div>{current&&HERO_IMAGES.includes(current)&&<span className="reference-hero-illustration">Illustrative image · upload your own in Branding</span>}{current&&<Photo src={typeof current==='string'?current:current} className="reference-store-hero-photo" eager alt={HERO_IMAGES.includes(current)?'Illustrative storefront photograph':store.name}/>}</div>{slides.length>1&&<div className="reference-hero-dots" role="group" aria-label="Choose storefront photograph">{slides.map((slide,position)=><button key={position} onClick={()=>setIndex(position)} aria-label={`Photograph ${position+1}`} aria-pressed={index===position}/>)}</div>}</section>;
}
