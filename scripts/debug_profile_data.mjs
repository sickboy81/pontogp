import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase.cerejavip.com');

async function testGetProfile() {
    try {
        console.log('🔌 Conectando ao PocketBase...')

        // Auth as superuser
        await pb.collection('_superusers').authWithPassword('egeohub101@gmail.com', '041052.11setemB');
        console.log('✅ Authenticated successfully');

        // Fetch specific profile
        const profileId = 'u42vyx3ockggv37';
        console.log(`📋 Buscando perfil ${profileId}...`);

        const profile = await pb.collection('profiles').getOne(profileId);

        console.log('🔍 Perfil encontrado:', profile.name, profile.id);
        console.log('-----------------------------------');
        console.log('DADOS DE APARÊNCIA:');
        console.log('hair_color:', profile.hair_color, typeof profile.hair_color);
        console.log('height:', profile.height, typeof profile.height);
        console.log('body_type:', profile.body_type, typeof profile.body_type);
        console.log('breast_type:', profile.breast_type, typeof profile.breast_type);
        console.log('pubis_type:', profile.pubis_type, typeof profile.pubis_type);
        console.log('-----------------------------------');
        console.log('DADOS DE LOCALIZAÇÃO:');
        console.log('location_lat:', profile.location_lat);
        console.log('location_lng:', profile.location_lng);
        console.log('location_approximate:', profile.location_approximate);
        console.log('service_locations:', profile.service_locations);
        console.log('-----------------------------------');
        console.log('OUTROS DADOS:');
        console.log('special_services:', profile.special_services);

    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

testGetProfile();
