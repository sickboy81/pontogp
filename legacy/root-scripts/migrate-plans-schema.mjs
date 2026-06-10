import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.VITE_POCKETBASE_URL || 'https://pocketbase.cerejavip.com');
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'egeohub101@gmail.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '041052.11setemB';

async function createField(collectionName, field) {
  try {
    const collection = await pb.collections.getOne(collectionName);
    
    // A API do PocketBase pode retornar 'schema' ou 'fields'
    const schema = collection.schema || collection.fields || [];
    
    // Verificar se o campo já existe
    const existingField = schema.find(f => f.name === field.name);
    if (existingField) {
      console.log(`  ⚠️  Campo ${field.name} já existe, pulando...`);
      return;
    }

    await pb.collections.update(collection.id, {
      schema: [...schema, field]
    });
    console.log(`  ✅ Campo ${field.name} criado`);
  } catch (error) {
    console.error(`  ❌ Erro ao criar campo ${field.name}:`, error.message);
    throw error;
  }
}

async function createCollection(name, fields) {
  try {
    // Verificar se collection já existe
    try {
      const existing = await pb.collections.getOne(name);
      console.log(`  ⚠️  Collection ${name} já existe, pulando criação...`);
      return existing;
    } catch {
      // Collection não existe, criar
    }

    const collection = await pb.collections.create({
      name,
      type: 'base',
      fields
    });
    console.log(`  ✅ Collection ${name} criada`);
    return collection;
  } catch (error) {
    console.error(`  ❌ Erro ao criar collection ${name}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔐 Autenticando como admin...');
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Autenticado com sucesso\n');

    // 1. Adicionar novos campos na collection plans
    console.log('📦 Adicionando novos campos na collection plans...');
    const plansCollection = await pb.collections.getOne('plans');

    const newFields = [
      {
        name: 'enabled',
        type: 'bool',
        required: false,
        options: { defaultValue: true }
      },
      {
        name: 'highlight_color',
        type: 'text',
        required: false
      },
      {
        name: 'price_weekly',
        type: 'number',
        required: false,
        options: { min: 0, defaultValue: 0 }
      },
      {
        name: 'price_monthly',
        type: 'number',
        required: false,
        options: { min: 0, defaultValue: 0 }
      },
      {
        name: 'daily_bumps',
        type: 'number',
        required: false,
        options: { min: 0, defaultValue: 0 }
      },
      {
        name: 'max_audio',
        type: 'number',
        required: false,
        options: { min: -1, defaultValue: 0 }
      },
      {
        name: 'highlight_percentage',
        type: 'number',
        required: false,
        options: { min: 0, max: 1000, defaultValue: 0 }
      }
    ];

    for (const field of newFields) {
      await createField('plans', field);
    }

    // Atualizar campo slug para aceitar novos valores (se for select)
    console.log('\n🔄 Verificando campo slug...');
    try {
      const collection = await pb.collections.getOne('plans');
      const schema = collection.schema || collection.fields || [];
      const slugField = schema.find(f => f.name === 'slug');
      if (slugField && slugField.type === 'select') {
        // Atualizar valores do select
        await pb.collections.update(collection.id, {
          schema: schema.map(f => 
            f.name === 'slug' 
              ? { ...f, options: { ...f.options, values: ['gratis', 'bronze', 'prata', 'ouro'] } }
              : f
          )
        });
        console.log('  ✅ Campo slug atualizado (select)');
      } else {
        console.log('  ℹ️  Campo slug é text, valores serão atualizados nos registros');
      }
    } catch (error) {
      console.log('  ⚠️  Não foi possível atualizar slug:', error.message);
    }

    // 2. Criar collection profile_daily_bumps
    console.log('\n📦 Criando collection profile_daily_bumps...');
    const profilesCollection = await pb.collections.getOne('profiles');
    
    await createCollection('profile_daily_bumps', [
      {
        name: 'profile',
        type: 'relation',
        required: true,
        collectionId: profilesCollection.id,
        maxSelect: 1,
        options: {
          cascadeDelete: true
        }
      },
      {
        name: 'date',
        type: 'date',
        required: true
      },
      {
        name: 'bumps_used',
        type: 'number',
        required: true,
        options: {
          min: 0,
          defaultValue: 0
        }
      }
    ]);

    // 3. Migrar dados existentes
    console.log('\n🔄 Migrando dados existentes...');
    const existingPlans = await pb.collection('plans').getFullList();
    
    const slugMapping = {
      'free': 'gratis',
      'premium': 'bronze',
      'vip': 'ouro'
    };

    for (const plan of existingPlans) {
      const newSlug = slugMapping[plan.slug];
      if (newSlug && plan.slug !== newSlug) {
        console.log(`  🔄 Migrando plano ${plan.name} de "${plan.slug}" para "${newSlug}"`);
        await pb.collection('plans').update(plan.id, {
          slug: newSlug,
          enabled: plan.enabled !== undefined ? plan.enabled : true,
          price_weekly: plan.price_weekly || 0,
          price_monthly: plan.price_monthly || plan.price || 0,
          daily_bumps: plan.daily_bumps || 0,
          max_audio: plan.max_audio || 0,
          highlight_percentage: plan.highlight_percentage || 0,
          highlight_color: plan.highlight_color || null
        });
        console.log(`  ✅ Plano ${plan.name} migrado`);
      } else {
        // Atualizar campos mesmo se slug não mudou
        await pb.collection('plans').update(plan.id, {
          enabled: plan.enabled !== undefined ? plan.enabled : true,
          price_weekly: plan.price_weekly || 0,
          price_monthly: plan.price_monthly || plan.price || 0,
          daily_bumps: plan.daily_bumps || 0,
          max_audio: plan.max_audio || 0,
          highlight_percentage: plan.highlight_percentage || 0,
          highlight_color: plan.highlight_color || null
        });
      }
    }

    // Migrar perfis
    console.log('\n🔄 Migrando perfis...');
    const profiles = await pb.collection('profiles').getFullList({ batch: 500 });
    let migratedProfiles = 0;
    
    for (const profile of profiles) {
      if (profile.plan && slugMapping[profile.plan]) {
        const newPlan = slugMapping[profile.plan];
        await pb.collection('profiles').update(profile.id, { plan: newPlan });
        migratedProfiles++;
      }
    }
    console.log(`  ✅ ${migratedProfiles} perfis migrados`);

    // 4. Criar planos que faltam (Grátis, Bronze, Prata, Ouro)
    console.log('\n📦 Verificando e criando planos padrão...');
    
    const defaultPlans = [
      {
        name: 'Grátis',
        slug: 'gratis',
        enabled: true,
        price_weekly: 0,
        price_monthly: 0,
        daily_bumps: 0,
        max_photos: 3,
        max_videos: 0,
        max_audio: 0,
        highlight_percentage: 0,
        highlight_color: '#9CA3AF',
        features: JSON.stringify([
          '3 fotos',
          'Perfil básico',
          'Sem subidas diárias'
        ]),
        featured: false,
        verified_badge: false,
        analytics: false
      },
      {
        name: 'Bronze',
        slug: 'bronze',
        enabled: true,
        price_weekly: 20,
        price_monthly: 65,
        daily_bumps: 6,
        max_photos: 10,
        max_videos: 0,
        max_audio: 0,
        highlight_percentage: 30,
        highlight_color: '#CD7F32',
        features: JSON.stringify([
          '6 subidas diárias',
          '10 fotos',
          'Destaque visual disponível'
        ]),
        featured: false,
        verified_badge: false,
        analytics: false
      },
      {
        name: 'Prata',
        slug: 'prata',
        enabled: true,
        price_weekly: 35,
        price_monthly: 110,
        daily_bumps: 12,
        max_photos: 20,
        max_videos: 1,
        max_audio: 0,
        highlight_percentage: 50,
        highlight_color: '#C0C0C0',
        features: JSON.stringify([
          '12 subidas diárias',
          'Galeria estendida',
          '1 vídeo',
          'Destaque visual disponível'
        ]),
        featured: false,
        verified_badge: false,
        analytics: false
      },
      {
        name: 'Ouro',
        slug: 'ouro',
        enabled: true,
        price_weekly: 55,
        price_monthly: 170,
        daily_bumps: 24,
        max_photos: -1, // Ilimitado
        max_videos: -1, // Ilimitado
        max_audio: 1,
        highlight_percentage: 100,
        highlight_color: '#FFD700',
        features: JSON.stringify([
          '24 subidas diárias',
          'Fotos ilimitadas',
          'Vídeos ilimitados',
          '1 áudio de apresentação',
          'Destaque visual disponível'
        ]),
        featured: true,
        verified_badge: true,
        analytics: true
      }
    ];

    // Buscar planos existentes novamente após migração
    const currentPlans = await pb.collection('plans').getFullList();
    
    for (const defaultPlan of defaultPlans) {
      const existingPlan = currentPlans.find(p => p.slug === defaultPlan.slug);
      if (!existingPlan) {
        console.log(`  ➕ Criando plano ${defaultPlan.name}...`);
        await pb.collection('plans').create(defaultPlan);
        console.log(`  ✅ Plano ${defaultPlan.name} criado`);
      } else {
        // Atualizar campos se o plano já existe mas está incompleto
        const needsUpdate = !existingPlan.price_weekly && !existingPlan.price_monthly && !existingPlan.daily_bumps;
        if (needsUpdate) {
          console.log(`  🔄 Atualizando plano ${defaultPlan.name}...`);
          await pb.collection('plans').update(existingPlan.id, {
            price_weekly: defaultPlan.price_weekly,
            price_monthly: defaultPlan.price_monthly,
            daily_bumps: defaultPlan.daily_bumps,
            max_audio: defaultPlan.max_audio,
            highlight_percentage: defaultPlan.highlight_percentage,
            highlight_color: defaultPlan.highlight_color,
            enabled: defaultPlan.enabled
          });
          console.log(`  ✅ Plano ${defaultPlan.name} atualizado`);
        } else {
          console.log(`  ✅ Plano ${defaultPlan.name} já existe`);
        }
      }
    }

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  }
}

main();
