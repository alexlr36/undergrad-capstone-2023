import React, { Fragment, useState } from 'react'
import Map from './Map';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import getShopsWithLocations from './api/getVendors';

export const getStaticProps: GetStaticProps = async () => {

  const { data } = await getShopsWithLocations();
  return { props: { shops: data }};
};

export default function Home({shops}: InferGetStaticPropsType<typeof getStaticProps>) { 

  //TODO: Instead of populating our map. perform getStaticProps here and pull DB data and pass to Map as props.
  //Get shops around area [1]
    //Populate shops with appropriate markers [2]
      //[1]
    //console.log("index: ",shops)
    return (
      <>
        <Map shops={shops}/>
      </>
    );
}
