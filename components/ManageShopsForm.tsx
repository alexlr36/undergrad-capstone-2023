import { useSessionContext, useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { useRouter } from "next/router";
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form";
import { supabase } from "../utils/supabaseClient";
import { getShopImage, uploadShopImage } from "../pages/api/cdnHelpers";
import get_vendor_by_id from "../pages/api/getVendorById";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import getShopsByVendorId from "../pages/api/getShopsByVendorId";

import { Switch } from '@headlessui/react'


type ManageShopsFormProps = {
    userID: string,
    images: FileList,
    setShowModal:any,
    formProps: formProps

}

type formProps = {
    shopID: string | undefined
    shopName: string,
    shopDescription: string,
    hawkrType: string,
    file: FileList,
    hoursOpen: string,
    minutesOpen: string, 
    ampmOpen: string,
    hoursClosed: string,
    minutesClosed: string,
    ampmClosed: string,
    liveTracking: Boolean,
    messagesFlag: Boolean
}


export default function ManageShopsForm({userID, setShowModal, editFlag, formProps}: any){

  

    type VendorContent = Awaited<ReturnType<typeof get_vendor_by_id>>
    type ImageContent = Awaited<ReturnType<typeof getShopImage>>
    type shopsContent = Awaited<ReturnType<typeof getShopsByVendorId>>



    // const router = useRouter()
    // type ContentKind = Parameters<typeof get_vendor_by_id>
    
    const [vendor, setVendor] = useState<VendorContent>()    
    // const [user, setUser] = useState<any>()
    // const [userID, setUserID] = useState<NonNullable<string>>()
    const [reloading, setReloading] = useState<boolean>(true)
    const [userLocation, setUserLocation] = useState<any>()
    const [shops, setShops] = useState<shopsContent>()

    const [enabled, setEnabled] = useState(false)


    // const userID = user?.id
    const router = useRouter()
    const { isLoading, session, error } = useSessionContext();
    const user = useUser()
    // const userID = user?.id

    const [images, setImages] = useState<ImageContent>()
    const SHOP_CDN_URL = 'https://mlijczvqqsvotbjytzjm.supabase.co/storage/v1/object/public/shop-images'

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
      } = useForm({
        defaultValues: formProps
      });
      
      useEffect( () => {

        const getImages = async (shopID: any) => {
              if (userID)
              {
                  const i = await getShopImage(userID, shopID, supabase)
                  setImages(i)
              }
          }


        if (editFlag){
            getImages(formProps.shopID).catch(console.error)
        }

    }, [editFlag])

      
      
      const onSubmit = async (formData:any) => {
          
          console.log('data contents: ',formData)
        var img_src
        console.log('FILE STATUS: ', formData.file)

    
        // console.log('USER CURRENT LOCATION: ', userLocation)
        
        let shopID = formData.shopID
        let vendorID = userID
        let shopName = formData.shopName
        let shopDescription = formData.shopDescription
        let messagesOn = formData.messagesFlag
        let liveTracking = formData.liveTracking
        let hawkrType = formData.hawkrType
        let timeOpen = `${formData.hoursOpen}:${formData.minutesOpen}${formData.ampmOpen}`
        let timeClosed = `${formData.hoursClosed}:${formData.minutesClosed}${formData.ampmClosed}`
        
        console.log(timeOpen, timeClosed)

        if (!editFlag){
            const { data, error } = await supabase
            .from('shops')
            .insert([
            { vendorID: vendorID,
                shopName: shopName ,
                shopDescription: shopDescription ,
                open: false ,
                timeOpen: timeOpen,
                timeClosed: timeClosed ,
                messagesOn: messagesOn ,
                liveTracking: liveTracking ,
                hawkrType: hawkrType, 
                shop_image_url: null},
            ])

            console.log('SUPABASE SHOP CREATION DATA CONENTS: ', data)
        
            if (formData.file['length'] > 0){


                const { data:resShop, error:error3 } = await supabase
                .from('shops')
                .select('shopID')
                .match(
                    { vendorID: vendorID,
                        shopName: shopName ,
                        shopDescription: shopDescription ,
                        // open: 'false' ,
                        timeOpen: timeOpen,
                        timeClosed: timeClosed ,
                        messagesOn: messagesOn ,
                        liveTracking: liveTracking ,
                        hawkrType: hawkrType, 
                        // shop_image_url: 'NULL',
                    },
                )

                const shopID = resShop ? resShop[0].shopID : ''


                console.log(formData.file[0])
                console.log(formData.file)

                //TODO / NOTE: when creating shop. can upload 1 image, but when editing. Needs to get first then remove from CDN and update DB
                await uploadShopImage(formData.file[0], supabase, user?.id, resShop)
                // const res_image =  await getShopImage(userID, supabase)
                
                // console.log('res image return: ', res_image)
                // setImages(res_image)
        
                console.log('USE STATE CONTENT OF IMAGES: ', images)
            //    console.log('VARIABLE D: ', d)
        
                // const image:any = images[0] //TODO: make type for this
        
                // console.log(res_image)

                //TODO: Change the path from userID to /UserID/ShopID/picture
                img_src =`${SHOP_CDN_URL}/${userID}/${shopID}/${formData.file[0].name}`
                
                // console.log("SUCCESSFULLLY ADDED TO CDN BRO!!!! :)")
                // formData.append('file', src)


                const { data:data2, error:error2 } = await supabase
                .from('shops')
                .update({ shop_image_url: img_src ? img_src : null })
                .match(
                    { vendorID: vendorID,
                        shopName: shopName ,
                        shopDescription: shopDescription ,
                        open: 'false' ,
                        timeOpen: timeOpen,
                        timeClosed: timeClosed ,
                        messagesOn: messagesOn ,
                        liveTracking: liveTracking ,
                        hawkrType: hawkrType, 
                        // shop_image_url: 'NULL',
                    },
                )
            }

            //get Shop ID that was recently posted
    
            // TEST IF THIS WORKS ^^^^^^^^^^ !!!!!!!!!!!!!!!!!

            // console.log('!!!!!!!!!!! SHOP ID VALUE: ', data5, error5)
            console.log('VALUE OF IMG SRC: ', img_src)

        
            const { data:data3, error:error3 } = await supabase
            .from('locations')
            .insert([
            { UUID: vendorID, location: userLocation },
            ])
        
        
            // console.log('supabase DETAILA !!!!!!! \t ', data2, error2)
            // console.log('form Data contents: ', formData);
        
            if  (!error){
                toast("Successfully created your shop!")
            }else{
                if (error){
                    alert('Error in creating shop')
                }else{
                    alert('Error in uploading locations')
                }
            }
        
            reset()
        }

        //Edit flag set
        else{

            var img_src;

            if (formData.file['length'] > 0){
                img_src =`${SHOP_CDN_URL}/${userID}/${shopID}/${formData.file[0].name}`
            }


            const {data, error} = await supabase
            .from('shops')
            .update({
                shopName: shopName,
                shopDescription: shopDescription,
                open: formData.open,
                timeOpen: timeOpen,
                timeClosed: timeClosed,
                messagesOn: messagesOn,
                liveTracking: liveTracking,
                hawkrType: hawkrType,
                shop_image_url: img_src ? img_src : 'https://via.placeholder.com/500'
            })
            .match({
                shopID: shopID
            })
        }


        };

return(
    <div className="overflow-scroll bg-white rounded-xl h-[75vh] w-[75vw] shadow-xl">
        <div className="flex justify-end">    
        {/* Dark color for button:  dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700 */}
        <button type="button" onClick={() => setShowModal(false)} className="absolute ml-auto mx-1.5 my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8" data-dismiss-target="#toast-default" aria-label="Close">
            <span className="sr-only">Close</span>
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>
        </div>
        <div  className="box-content h-4/5 w-4/5">

        <div className="flex justify-center items-center pl-52">
            <form 
                onSubmit={handleSubmit(onSubmit)}
                method="POST"
                className="space-y-8 divide-y divide-gray-200"
                >
            <div className="space-y-8 divide-y divide-gray-200">
                <div>
                    <div>
                        <h3 className="text-base font-semibold leading-6 pt-4 text-gray-900">Create a shop</h3>
                        <p className="mt-1 text-sm text-gray-500">
                        This information will be displayed publicly so be careful what you share.
                        </p>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="shopName" className="block text-sm font-medium leading-6 text-gray-900">
                                Shop Name
                            </label>
                            <div className="mt-2">
                                <input
                                type="text"
                                id="shopName"
                                autoComplete="given-name"
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                {...register("shopName", {required: true})}
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-4">
                            <label htmlFor="shopDescription" className="block text-sm font-medium leading-6 text-gray-900">
                                About
                            </label>
                            <div className="mt-2">
                                <textarea
                                id="shopDescription"
                                rows={3}
                                className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                                defaultValue={''}
                                {...register("shopDescription", {required: true})}
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">Write a few sentences about yourself.</p>
                        </div>



                    <div className="sm:col-span-5">
                        <label htmlFor="hawkrType" className="block text-sm font-medium leading-6 text-gray-900">
                            Hawkr Type
                        </label>
                        <div className="mt-2">
                            <select
                            id="hawkrType"
                            autoComplete="hawkrType"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            {...register("hawkrType", {required: true})}
                            >
                            <option>FoodTruck</option>
                            <option>Art</option>
                            <option>Clothes</option>
                            </select>
                        </div>
                    </div>

                </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label htmlFor="photo" className="block text-sm font-medium leading-6 text-gray-900">
                                Current Shop Photo
                            </label>
                            <div className="mt-2 flex items-center">
                            {images?.data?.map( (image:any) => {
                                return(
                                    <>
                                     {console.log(image)}
                                    {console.log(`Image ID: ${image.id}\tImage Name: ${image.name}`)}
                                    {console.log(`URL: ${SHOP_CDN_URL}/${userID}/${image.name}`)}  
                                    <Image key={image.id} height={100} width={100} alt="hi" src={SHOP_CDN_URL + '/' + userID + '/' + image.name}/>
                                    </>
                                    );
                            })}
                            </div>
                        </div>

                        <div className="sm:col-span-6">
                            <label htmlFor="file" className="block text-sm font-medium leading-6 text-gray-900">
                                Shop Photo
                            </label>
                            
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">Upload file</label>
                            <input className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50" 
                                aria-describedby="file_input_help" 
                                type="file"
                                {...register("file", {required: false})}
                                />
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">SVG, PNG, JPG or GIF (MAX. 800x400px).</p>

                        </div>
                    </div>
                </div>

                {/* Time Open */}
                <div className="pt-8">
                    <div>
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Time Open</h3>
                        <p className="mt-1 text-sm text-gray-500">Typical time open during days open</p>
                    </div>
                </div>

                <div className="mt-2 p-3 w-7/12 bg-white rounded-lg shadow-xl">
                    <div className="flex-col">
                        <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                            {...register("hoursOpen", {required: true})}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                        </select>
                        <span className="text-l mr-2">:</span>
                        <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                            {...register("minutesOpen", {required: true})}>
                        <option value="00">00</option>
                        <option value="05">05</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="35">35</option>
                        <option value="40">40</option>
                        <option value="45">45</option>
                        <option value="50">50</option>
                        <option value="55">55</option>
                        </select>
                        <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                            {...register("ampmOpen", {required: true})}>
                        <option value="am">AM</option>
                        <option value="pm">PM</option>
                        </select>
                    </div>
                </div>

                {/* Time Closed */}
                <div className="pt-8">
                    <div>
                        <h3 className="text-base font-semibold leading-6 text-gray-900">Time Closed</h3>
                        <p className="mt-1 text-sm text-gray-500">Time open up to this time</p>
                    </div>
                </div>

                <div className="mt-2 p-3 w-7/12 bg-white rounded-lg shadow-xl">
                    <div className="flex-col">
                        <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                            {...register("hoursClosed", {required: true})}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                        </select>
                        <span className="text-l mr-2">:</span>
                        <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                            {...register("minutesClosed", {required: true})}>
                        <option value="00">00</option>
                        <option value="05">05</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="35">35</option>
                        <option value="40">40</option>
                        <option value="45">45</option>
                        <option value="50">50</option>
                        <option value="55">55</option>
                        </select>
                        <select className="border-transparent bg-transparent text-l appearance-none outline-none"
                            {...register("ampmClosed", {required: true})}>
                        <option value="am">AM</option>
                        <option value="pm">PM</option>
                        </select>
                    </div>
                </div>


                <div className="pt-8">
                <div>
                    <h3 className="text-base font-semibold leading-6 text-gray-900">Shop Settings</h3>
                    <p className="mt-1 text-sm text-gray-500">
                    Personalized settings on how to run your Shop. Manually or automatically
                    </p>
                </div>
                <div className="mt-6">
                    <fieldset>
                    <legend className="sr-only">Live Tracking</legend>
                    <div className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                        Tracking
                    </div>
                    <div className="mt-4 space-y-4">
                        <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                                <input
                                id="liveTracking"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                {...register("liveTracking", {required: false})}
                                />
                            </div>
                            <div className="ml-3">
                                <label htmlFor="liveTracking" className="text-sm font-medium leading-6 text-gray-900">
                                Live Tracking
                                </label>
                                <p className="text-sm text-gray-500">Automatically track your location. No need for manual entry</p>
                            </div>
                        </div>

                        <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                                <input
                                id="messagesFlag"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                {...register("messagesFlag", {required: false})}
                                />
                            </div>
                            <div className="ml-3">
                                <label htmlFor="messagesFlag" className="text-sm font-medium leading-6 text-gray-900">
                                Messages
                                </label>
                                <p className="text-sm text-gray-500">Ability to accept messages from client</p>
                            </div>
                        </div>

                    </div>
                    </fieldset>
                </div>
                </div>
            </div>

            <div className="py-5">
                <div className="flex justify-end">
                <button
                    type="button"
                    className="rounded-md bg-white py-2 px-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="ml-3 inline-flex justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Save
                </button>
                </div>
            </div>
            </form>
            </div>
            </div>
            <ToastContainer />
    </div>
)


}