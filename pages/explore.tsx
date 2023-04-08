import React, { useEffect, useState } from 'react'
import Map from '../components/Map';
import { Transition } from '@headlessui/react'
import { useQuery } from 'react-query';
import getShopsWithLocations from './api/getVendors';
import InfoCard from '../components/InfoCard'
import Pagination from '../components/pagination';

//Image imports
import hawkr_icon from '../public/img/hawkr_icon.png';
import LeftArrow from '../public/img/Left_Arrow.svg'
import RightArrow from '../public/img/Right_Arrow.svg'
import Image from 'next/image'
import Link from 'next/link';

type ExploreMenuProps = {
  shops:any
}

function SidePanelMenu(props: ExploreMenuProps) {
  const [curr_page, setCurrPage] = useState(1)


  //Hawkr-blue is #1498
  return (
      <main className="flex">
        <section className="flex-grow h-screen pt-6 px-6 bg-slate-200 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <h1 className=' pb-2 pl-2 font-bold text-gray-600 text-2xl'> Hawkrs near me</h1>

            <div className="flex flex-col">
              {props.shops?.map((item: any) => (
                <Link key={item.shopID} href={`shops/${item.shopID}`}>
                <InfoCard
                  key={item.shopID}
                  img={hawkr_icon}
                  description={item.shopDescription}
                  title={item.shopName}
                  />
                  </Link>
                ))}
            </div>
            <div className="flex flex-col items-center justify-center">
              <Link href='/hawkrVendorInfo' className="text-xl font-medium text-black">Want to run your business?</Link>
              <Link href='/hawkrVendorInfo'className="text-2xl font-bold text-sky-500">Setup a Hawkr</Link>
            </div>
          <Pagination curr_page_idx={curr_page} total_items={props.shops.length} 
          items_on_each_page={10} on_page_swith_to={(num)=>setCurrPage(num)}/>
        </section>
      </main>
  )
}

function Explore() {

  let [showOpen, setShowOpen] = useState(true)

  const {isLoading, data:shops, isError, error} = useQuery('shops-with-locations', getShopsWithLocations)

  if(isLoading){
    return <p>Loading...</p>
  }
  if(isError && error instanceof Error){
    return <h2>{error.message}</h2>
  }

  if(shops && shops.data){
    let openShops = shops.data.filter( (shop:any) => shop.open )
    console.log('openShops: ', openShops)
    return (
      <>
      <div className="flex justify-between bg-slate-200">
        <Transition className="w-full sm:w-2/5" show={showOpen}
          enter='transition-all' enterFrom='opacity-0 w-0' enterTo='opacity-100 w-full sm:w-2/5'
          leave='transition-all' leaveFrom='opacity-100 w-full sm:w-2/5 ' leaveTo='opacity-0 w-0'>
          <button className='p-2 border-gray-300 bg-white text-gray-700 m-5 sm:hidden'
            onClick={() => setShowOpen(!showOpen)}> 
            {showOpen ? <Image width={23} height={23} alt="LeftArrow" src={LeftArrow.src} /> : <div className="flex text-blue-500 text-base"><Image width={20} height={20} alt="RightArrow" src={RightArrow.src} />Show List</div>}
          </button>
          <SidePanelMenu shops={openShops} />
        </Transition>
        <div className='relative grow'>
          <button className={'absolute z-10 sm:rounded sm:border border-gray-300 bg-white sm:px-2.5 sm:py-1.5 sm:text-xs font-medium text-gray-700 sm:shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:m-8' + (showOpen?"":"absolute m-5")}
            onClick={() => setShowOpen(!showOpen)}>
            {showOpen ? <Image width={23} height={23} alt="LeftArrow" src={LeftArrow.src} /> : <div className="flex text-blue-500 text-base"><Image width={20} height={20} alt="RightArrow" src={RightArrow.src} />Show List</div>}
          </button>
          <Map shops={openShops} showOpen={showOpen}/>
        </div>
      </div>
    </>
  )
}
}

export default Explore;