import React, {useEffect, useState} from 'react';
import {Alert, FlatList, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseAnon && !supabaseUrl.includes('YOUR_PROJECT'))
  ? createClient(supabaseUrl, supabaseAnon) : null;

const demoProducts = [
  {id:'1', title:'هاتف مستعمل', price:850, category:'إلكترونيات', city:'ترهونة', emoji:'📱'},
  {id:'2', title:'سماعة بلوتوث', price:45, category:'إلكترونيات', city:'ترهونة', emoji:'🎧'},
  {id:'3', title:'حذاء رياضي', price:80, category:'ملابس', city:'ترهونة', emoji:'👟'},
  {id:'4', title:'كرسي مكتب', price:120, category:'منزل', city:'ترهونة', emoji:'🪑'}
];

const cats = [
  ['🛍️','السوق'], ['🍔','مطاعم'], ['🛵','توصيل'], ['🔧','خدمات'],
  ['🚕','تاكسي'], ['🏪','محلات'], ['🎁','هدايا'], ['📦','أخرى']
];

export default function App(){
  const [tab,setTab]=useState('home');
  const [products,setProducts]=useState(demoProducts);
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState('');
  const [showAdd,setShowAdd]=useState(false);
  const [session,setSession]=useState(null);

  useEffect(()=>{
    AsyncStorage.getItem('tm_demo_session').then(v=>v && setSession(JSON.parse(v)));
    loadProducts();
  },[]);

  async function loadProducts(){
    if(!supabase) return;
    const {data,error}=await supabase.from('products').select('*').eq('status','active').order('created_at',{ascending:false});
    if(!error && data) setProducts(data);
  }

  const filtered=products.filter(p => (p.title||'').includes(search) || (p.category||'').includes(search));

  function screen(){
    if(tab==='home') return <Home onCat={setTab} products={filtered} onProduct={setSelected}/>;
    if(tab==='market') return <Market products={filtered} search={search} setSearch={setSearch} onProduct={setSelected} onAdd={()=>setShowAdd(true)}/>;
    if(tab==='food') return <Simple title="🍔 المطاعم" items={['مطعم البيت الليبي','مطعم الذوق','مطعم الواحة']} action="عرض المنيو"/>;
    if(tab==='delivery') return <Delivery/>;
    if(tab==='services') return <Simple title="🔧 الخدمات" items={['كهربائي','سباك','تنظيف منازل','صيانة أجهزة']} action="طلب خدمة"/>;
    if(tab==='taxi') return <Delivery taxi/>;
    if(tab==='profile') return <Profile session={session} setSession={setSession}/>;
    return <Home onCat={setTab} products={filtered} onProduct={setSelected}/>;
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}>
      <Text style={styles.logo}>ترهونة ماركت 🛍️</Text>
      <Text style={styles.sub}>كل خدمات ترهونة في مكان واحد</Text>
    </View>
    <View style={{flex:1}}>{screen()}</View>
    <View style={styles.nav}>
      <Nav label="الرئيسية" icon="🏠" active={tab==='home'} onPress={()=>setTab('home')}/>
      <Nav label="السوق" icon="🛍️" active={tab==='market'} onPress={()=>setTab('market')}/>
      <Nav label="إضافة" icon="➕" active={false} onPress={()=>setShowAdd(true)}/>
      <Nav label="توصيل" icon="🛵" active={tab==='delivery'} onPress={()=>setTab('delivery')}/>
      <Nav label="حسابي" icon="👤" active={tab==='profile'} onPress={()=>setTab('profile')}/>
    </View>

    <Modal visible={!!selected} animationType="slide" onRequestClose={()=>setSelected(null)}>
      {selected && <ProductDetail product={selected} close={()=>setSelected(null)}/>}
    </Modal>

    <Modal visible={showAdd} animationType="slide" onRequestClose={()=>setShowAdd(false)}>
      <AddProduct close={()=>setShowAdd(false)} onAdded={p=>{setProducts([p,...products]);setShowAdd(false)}}/>
    </Modal>
  </SafeAreaView>
}

function Nav({label,icon,onPress,active}){return <Pressable onPress={onPress} style={styles.navItem}><Text style={{fontSize:21}}>{icon}</Text><Text style={[styles.navText,active&&styles.navActive]}>{label}</Text></Pressable>}

function Home({onCat,products,onProduct}){
 return <ScrollView contentContainerStyle={styles.content}>
   <TextInput placeholder="🔎 ابحث عن منتج أو خدمة..." style={styles.search}/>
   <Text style={styles.title}>شن تبي اليوم؟</Text>
   <View style={styles.grid}>{cats.map(([i,n])=><Pressable key={n} style={styles.cat} onPress={()=>onCat(n==='السوق'?'market':n==='مطاعم'?'food':n==='توصيل'?'delivery':n==='خدمات'?'services':n==='تاكسي'?'taxi':'market')}><Text style={{fontSize:25}}>{i}</Text><Text style={styles.catText}>{n}</Text></Pressable>)}</View>
   <View style={styles.banner}><Text style={styles.bannerTitle}>🔥 عروض اليوم</Text><Text>خلي إعلانك يوصل لناس ترهونة</Text></View>
   <Text style={styles.title}>منتجات قريبة منك</Text>
   <ProductGrid products={products} onProduct={onProduct}/>
 </ScrollView>
}

function Market({products,search,setSearch,onProduct,onAdd}){
 return <View style={{flex:1}}>
   <View style={{padding:15}}>
    <TextInput value={search} onChangeText={setSearch} placeholder="🔎 ابحث في المنتجات..." style={styles.search}/>
    <Pressable style={styles.primary} onPress={onAdd}><Text style={styles.primaryText}>＋ أضف إعلانك</Text></Pressable>
   </View>
   <FlatList contentContainerStyle={{padding:15,paddingTop:0}} data={products} numColumns={2} keyExtractor={x=>x.id} renderItem={({item})=><ProductCard p={item} onPress={()=>onProduct(item)}/>} />
 </View>
}

function ProductGrid({products,onProduct}){return <View style={styles.cards}>{products.map(p=><ProductCard key={p.id} p={p} onPress={()=>onProduct(p)}/>)}</View>}
function ProductCard({p,onPress}){return <Pressable style={styles.card} onPress={onPress}><View style={styles.pic}>{p.image_url?<Image source={{uri:p.image_url}} style={styles.img}/>:<Text style={{fontSize:42}}>{p.emoji||'📦'}</Text>}</View><View style={styles.info}><Text numberOfLines={1} style={styles.cardTitle}>{p.title}</Text><Text style={styles.price}>{p.price} د.ل</Text><Text style={styles.muted}>{p.city||'ترهونة'}</Text></View></Pressable>}

function ProductDetail({product,close}){return <SafeAreaView style={styles.modal}><Pressable onPress={close}><Text style={styles.back}>← رجوع</Text></Pressable><View style={[styles.pic,{height:260}]}>{product.image_url?<Image source={{uri:product.image_url}} style={styles.img}/>:<Text style={{fontSize:80}}>{product.emoji||'📦'}</Text>}</View><Text style={styles.big}>{product.title}</Text><Text style={styles.bigPrice}>{product.price} د.ل</Text><Text style={styles.muted}>{product.category||'أخرى'} • {product.city||'ترهونة'}</Text><Pressable style={styles.primary} onPress={()=>Alert.alert('تواصل','سيتم ربط المحادثة في المرحلة التالية.') }><Text style={styles.primaryText}>💬 تواصل مع البائع</Text></Pressable></SafeAreaView>}

function AddProduct({close,onAdded}){
 const [title,setTitle]=useState(''),[price,setPrice]=useState(''),[category,setCategory]=useState('أخرى'),[image,setImage]=useState(null),[busy,setBusy]=useState(false);
 async function pick(){const r=await ImagePicker.requestMediaLibraryPermissionsAsync();if(!r.granted)return Alert.alert('الصلاحية مطلوبة','اسمح للتطبيق بالوصول للصور.');const x=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.7});if(!x.canceled)setImage(x.assets[0].uri)}
 async function save(){
  if(!title||!price)return Alert.alert('ناقص','اكتب اسم المنتج والسعر.');
  setBusy(true);
  const p={id:Date.now().toString(),title,price:Number(price),category,city:'ترهونة',image_url:image,emoji:'📦',status:'active'};
  if(supabase){const {data,error}=await supabase.from('products').insert([{title,price:Number(price),category,city:'ترهونة',image_url:image,status:'active'}]).select().single();if(error)Alert.alert('خطأ',error.message);else onAdded(data);}
  else onAdded(p);
  setBusy(false);
 }
 return <SafeAreaView style={styles.modal}><Pressable onPress={close}><Text style={styles.back}>← رجوع</Text></Pressable><Text style={styles.big}>＋ إضافة إعلان</Text><Pressable style={styles.upload} onPress={pick}>{image?<Image source={{uri:image}} style={styles.preview}/>:<Text style={{fontSize:35}}>📷</Text>}<Text>اضغط لاختيار صورة</Text></Pressable><TextInput placeholder="اسم المنتج" value={title} onChangeText={setTitle} style={styles.input}/><TextInput placeholder="السعر بالدينار" keyboardType="numeric" value={price} onChangeText={setPrice} style={styles.input}/><TextInput placeholder="القسم" value={category} onChangeText={setCategory} style={styles.input}/><Pressable style={styles.primary} onPress={save} disabled={busy}><Text style={styles.primaryText}>{busy?'جاري الحفظ...':'نشر الإعلان'}</Text></Pressable></SafeAreaView>
}

function Simple({title,items,action}){return <ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>{title}</Text>{items.map(x=><View style={styles.service} key={x}><Text style={{fontSize:19,fontWeight:'800'}}>{x}</Text><Text style={styles.muted}>متاح داخل ترهونة</Text><Pressable style={styles.primary} onPress={()=>Alert.alert(x,`سيتم ربط ${action} بالطلبات الحقيقية في المرحلة القادمة.`)}><Text style={styles.primaryText}>{action}</Text></Pressable></View>)}</ScrollView>}
function Delivery({taxi=false}){return <ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>{taxi?'🚕 اطلب تاكسي':'🛵 اطلب توصيل'}</Text><TextInput placeholder="من وين؟" style={styles.input}/><TextInput placeholder="لوين؟" style={styles.input}/><TextInput placeholder="ملاحظات" style={styles.input}/><Pressable style={styles.primary} onPress={()=>Alert.alert('تم','تم تسجيل طلب تجريبي.')}><Text style={styles.primaryText}>{taxi?'طلب تاكسي':'اطلب مندوب'}</Text></Pressable></ScrollView>}
function Profile({session,setSession}){return <ScrollView contentContainerStyle={styles.content}><Text style={styles.title}>👤 حسابي</Text>{session?<><Text style={styles.service}>أهلًا بك<br/>{session.email}</Text><Pressable style={styles.primary} onPress={()=>{AsyncStorage.removeItem('tm_demo_session');setSession(null)}}><Text style={styles.primaryText}>تسجيل الخروج</Text></Pressable></>:<><Text style={styles.muted}>تسجيل الدخول سيُضاف مع نظام الحسابات الحقيقي.</Text><Pressable style={styles.primary} onPress={async()=>{const s={email:'demo@tarhouna.market'};await AsyncStorage.setItem('tm_demo_session',JSON.stringify(s));setSession(s)}}><Text style={styles.primaryText}>تجربة حساب تجريبي</Text></Pressable></>}</ScrollView>}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#fff'},header:{backgroundColor:'#101a2e',padding:18,paddingTop:12,borderBottomLeftRadius:24,borderBottomRightRadius:24},logo:{color:'#fff',fontSize:25,fontWeight:'900'},sub:{color:'#cbd2df',marginTop:4},content:{padding:15,paddingBottom:90},search:{backgroundColor:'#f3f5f8',borderRadius:14,padding:13,marginBottom:14},title:{fontSize:21,fontWeight:'900',marginVertical:13},grid:{flexDirection:'row',flexWrap:'wrap',gap:9},cat:{width:'22.5%',backgroundColor:'#f3f5f8',borderRadius:15,padding:10,alignItems:'center'},catText:{fontSize:11,marginTop:5,fontWeight:'700'},banner:{backgroundColor:'#ffb11b',padding:16,borderRadius:18,marginVertical:18},bannerTitle:{fontSize:19,fontWeight:'900',marginBottom:5},cards:{flexDirection:'row',flexWrap:'wrap',gap:12},card:{width:'47.5%',borderWidth:1,borderColor:'#e7e9ee',borderRadius:16,overflow:'hidden',marginBottom:10,backgroundColor:'#fff'},pic:{height:125,backgroundColor:'#e8edf3',alignItems:'center',justifyContent:'center'},img:{width:'100%',height:'100%',resizeMode:'cover'},info:{padding:10},cardTitle:{fontWeight:'800'},price:{fontWeight:'900',fontSize:16,marginTop:5},muted:{color:'#747d8c',fontSize:12,marginTop:4},primary:{backgroundColor:'#101a2e',padding:14,borderRadius:13,alignItems:'center',marginTop:10},primaryText:{color:'#fff',fontWeight:'900'},nav:{position:'absolute',bottom:0,left:0,right:0,height:68,backgroundColor:'#fff',borderTopWidth:1,borderTopColor:'#eee',flexDirection:'row',justifyContent:'space-around',alignItems:'center'},navItem:{alignItems:'center',minWidth:55},navText:{fontSize:10,color:'#6d7583'},navActive:{color:'#101a2e',fontWeight:'900'},modal:{flex:1,padding:18,backgroundColor:'#fff'},back:{fontSize:15,fontWeight:'800',marginBottom:15},big:{fontSize:24,fontWeight:'900',marginTop:15},bigPrice:{fontSize:22,fontWeight:'900',marginTop:8},input:{borderWidth:1,borderColor:'#ddd',borderRadius:12,padding:13,marginVertical:6},upload:{height:180,borderRadius:16,backgroundColor:'#f2f4f7',alignItems:'center',justifyContent:'center',marginVertical:10},preview:{width:'100%',height:'100%',borderRadius:16},service:{borderWidth:1,borderColor:'#e7e9ee',padding:15,borderRadius:16,marginBottom:12}
});
