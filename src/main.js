import './style.css'
import Alpine from 'alpinejs'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

window.Alpine = Alpine

Alpine.data('vacances', () => ({
  zones: ['A', 'B', 'C'],
  selectedZone: 'all',
  selectedAcademie: 'all',
  anneeScolaires: ['2023-2024', '2024-2025'],
  selectedAnnee: '2023-2024',
  vacances: [],
  loading: false,
  error: null,

  // Mapping des académies par zone
  academies: {
    'A': [
      'Besançon', 'Bordeaux', 'Clermont-Ferrand', 'Dijon', 
      'Grenoble', 'Limoges', 'Lyon', 'Poitiers'
    ],
    'B': [
      'Aix-Marseille', 'Amiens', 'Lille', 'Nancy-Metz', 
      'Nantes', 'Nice', 'Normandie', 'Orléans-Tours', 
      'Reims', 'Rennes', 'Strasbourg'
    ],
    'C': [
      'Créteil', 'Montpellier', 'Paris', 
      'Toulouse', 'Versailles'
    ]
  },

  // Getter pour obtenir la liste des académies selon la zone sélectionnée
  get filteredAcademies() {
    if (this.selectedZone === 'all') {
      return Object.values(this.academies).flat()
    }
    return this.academies[this.selectedZone] || []
  },

  // Coordonnées approximatives des académies
  academiesCoordinates: {
    'A': [
      { name: 'Besançon', lat: 47.237829, lng: 6.024054 },
      { name: 'Bordeaux', lat: 44.837789, lng: -0.57918 },
      { name: 'Clermont-Ferrand', lat: 45.777222, lng: 3.087025 },
      { name: 'Dijon', lat: 47.322047, lng: 5.041480 },
      { name: 'Grenoble', lat: 45.188529, lng: 5.724524 },
      { name: 'Limoges', lat: 45.833619, lng: 1.261105 },
      { name: 'Lyon', lat: 45.764043, lng: 4.835659 },
      { name: 'Poitiers', lat: 46.580224, lng: 0.340375 }
    ],
    'B': [
      { name: 'Aix-Marseille', lat: 43.296482, lng: 5.369780 },
      { name: 'Amiens', lat: 49.894067, lng: 2.295753 },
      { name: 'Lille', lat: 50.629250, lng: 3.057256 },
      { name: 'Nancy-Metz', lat: 48.692054, lng: 6.184417 },
      { name: 'Nantes', lat: 47.218371, lng: -1.553621 },
      { name: 'Nice', lat: 43.710173, lng: 7.261953 },
      { name: 'Normandie', lat: 49.182863, lng: 0.370679 },
      { name: 'Orléans-Tours', lat: 47.902964, lng: 1.909251 },
      { name: 'Reims', lat: 49.258329, lng: 4.031696 },
      { name: 'Rennes', lat: 48.117266, lng: -1.677793 },
      { name: 'Strasbourg', lat: 48.573405, lng: 7.752111 }
    ],
    'C': [
      { name: 'Créteil', lat: 48.790367, lng: 2.452789 },
      { name: 'Montpellier', lat: 43.610769, lng: 3.876716 },
      { name: 'Paris', lat: 48.856614, lng: 2.352222 },
      { name: 'Toulouse', lat: 43.604652, lng: 1.444209 },
      { name: 'Versailles', lat: 48.804865, lng: 2.120355 }
    ]
  },

  initMap() {
    this.map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [2.213749, 46.227638], // Centre de la France
      zoom: 5
    })

    this.map.on('load', () => {
      this.addMarkersToMap()
    })
  },

  addMarkersToMap() {
    // Supprime les marqueurs existants
    if (this.markers) {
      this.markers.forEach(marker => marker.remove())
    }
    this.markers = []

    // Ajoute les nouveaux marqueurs
    Object.entries(this.academiesCoordinates).forEach(([zone, academies]) => {
      academies.forEach(academie => {
        if (this.selectedZone === 'all' || this.selectedZone === zone) {
          // Créer un conteneur pour le marqueur
          const container = document.createElement('div')
          container.className = 'marker-container'
          
          // Créer le point du marqueur
          const markerDot = document.createElement('div')
          Object.assign(markerDot.style, {
            width: '20px',
            height: '20px',
            backgroundColor: this.getZoneColor(zone),
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.2s ease'
          })

          container.appendChild(markerDot)

          // Gérer les événements de survol
          container.addEventListener('mouseenter', () => {
            markerDot.style.transform = 'translate(-50%, -50%) scale(1.2)'
            markerDot.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
          })

          container.addEventListener('mouseleave', () => {
            markerDot.style.transform = 'translate(-50%, -50%)'
            markerDot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
          })

          const marker = new maplibregl.Marker({
            element: container
          })
            .setLngLat([academie.lng, academie.lat])
            .setPopup(
              new maplibregl.Popup({ 
                offset: 25,
                closeButton: false,
                closeOnClick: false
              })
              .setHTML(`
                <div class="p-2">
                  <div class="font-bold">${academie.name}</div>
                  <div class="text-sm text-gray-600">Zone ${zone}</div>
                </div>
              `)
            )
            .addTo(this.map)

          // Ajouter l'événement de clic
          container.addEventListener('click', () => {
            this.filterByAcademie(academie.name, zone)
            
            // Effet visuel sur le marqueur sélectionné
            markerDot.style.transform = 'translate(-50%, -50%) scale(1.3)'
            setTimeout(() => {
              markerDot.style.transform = 'translate(-50%, -50%)'
            }, 200)
            
            // Gérer les popups
            this.markers.forEach(m => m.getPopup().remove())
            marker.togglePopup()
          })

          this.markers.push(marker)
        }
      })
    })
  },

  getZoneColor(zone) {
    const colors = {
      'A': '#4F46E5',
      'B': '#0EA5E9',
      'C': '#14B8A6'
    }
    return colors[zone] || '#666666'
  },

  async init() {
    await this.fetchVacances()
  },

  async fetchVacances() {
    this.loading = true
    this.error = null
    try {
      let url = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records'
      
      // Construction des paramètres de filtrage
      const params = new URLSearchParams({
        limit: 100,
        select: 'description,start_date,end_date,zones,location,annee_scolaire'
      })
      
      // Ajout des filtres
      let whereConditions = []
      
      if (this.selectedZone !== 'all') {
        whereConditions.push(`zones = 'Zone ${this.selectedZone}'`)
      }
      if (this.selectedAnnee) {
        whereConditions.push(`annee_scolaire = '${this.selectedAnnee}'`)
      }
      if (this.selectedAcademie !== 'all') {
        whereConditions.push(`location LIKE '%${this.selectedAcademie}%'`)
      }
      
      if (whereConditions.length > 0) {
        params.append('where', whereConditions.join(' AND '))
      }
      
      const response = await fetch(`${url}?${params.toString()}`)
      if (!response.ok) throw new Error('Erreur lors de la récupération des données')
      const data = await response.json()
      
      this.vacances = data.results.map(record => ({
        id: crypto.randomUUID(),
        nom: record.description,
        debut: new Date(record.start_date).toLocaleDateString('fr-FR'),
        fin: new Date(record.end_date).toLocaleDateString('fr-FR'),
        zone: record.zones,
        location: record.location,
        anneeScolaire: record.annee_scolaire
      }))
    } catch (err) {
      this.error = "Impossible de charger les données des vacances scolaires"
      console.error(err)
    } finally {
      this.loading = false
    }
  },

  get filteredVacances() {
    return this.vacances
      .filter(v => {
        if (this.selectedZone !== 'all' && v.zone !== `Zone ${this.selectedZone}`) return false
        if (this.selectedAcademie !== 'all' && !v.location?.includes(this.selectedAcademie)) return false
        return true
      })
      .sort((a, b) => new Date(a.debut) - new Date(b.debut))
  },

  // Nouvelle méthode pour filtrer par académie
  filterByAcademie(academieName, zone) {
    this.selectedZone = zone
    this.selectedAcademie = academieName
    this.fetchVacances()
    
    // Trouve les coordonnées de l'académie sélectionnée
    const academie = this.academiesCoordinates[zone].find(a => a.name === academieName)
    if (academie) {
      // Centre la carte sur l'académie sélectionnée avec un zoom plus proche
      this.map.flyTo({
        center: [academie.lng, academie.lat],
        zoom: 8,
        duration: 1500 // durée de l'animation en millisecondes
      })
    }
  }
}))

document.querySelector('#app').innerHTML = `
  <div class="min-h-screen bg-[#1C1C1C] text-white" x-data="vacances">
    <!-- Header -->
    <header class="border-b border-gray-800">
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-4xl font-bold text-center mb-2">
          Vacances Scolaires
        </h1>
        <p class="text-center text-gray-400 max-w-2xl mx-auto">
          Retrouvez toutes les dates des vacances scolaires en France par zone et académie
        </p>
      </div>
    </header>

    <!-- Carte des zones -->
    <div class="container mx-auto px-4 py-8">
      <div class="bg-gray-900 rounded-xl overflow-hidden mb-8">
        <div id="map" class="w-full h-[400px]" x-init="initMap()"></div>
      </div>

      <!-- Filtres -->
      <div class="bg-gray-900 rounded-xl p-6 mb-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Sélecteur de Zone -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-400">Zone Académique</label>
            <div class="flex gap-2">
              <button 
                @click="selectedZone = 'all'; selectedAcademie = 'all'; fetchVacances()"
                :class="{'bg-blue-600 text-white': selectedZone === 'all',
                        'bg-gray-800 text-gray-300 hover:bg-gray-700': selectedZone !== 'all'}"
                class="px-4 py-2 rounded-lg transition-colors duration-200 flex-1">
                Toutes
              </button>
              <template x-for="zone in zones" :key="zone">
                <button 
                  @click="selectedZone = zone; selectedAcademie = 'all'; fetchVacances()"
                  :class="{
                    'text-white': selectedZone === zone,
                    'bg-zone-a': selectedZone === zone && zone === 'A',
                    'bg-zone-b': selectedZone === zone && zone === 'B',
                    'bg-zone-c': selectedZone === zone && zone === 'C',
                    'bg-gray-800 text-gray-300 hover:bg-gray-700': selectedZone !== zone
                  }"
                  class="px-4 py-2 rounded-lg transition-colors duration-200 flex-1"
                  x-text="zone">
                </button>
              </template>
            </div>
          </div>

          <!-- Sélecteur d'Académie -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-400">Académie</label>
            <select 
              x-model="selectedAcademie"
              @change="fetchVacances()"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">Toutes les académies</option>
              <template x-for="academie in filteredAcademies.sort()" :key="academie">
                <option x-text="academie" :value="academie"></option>
              </template>
            </select>
          </div>

          <!-- Sélecteur d'Année -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-400">Année Scolaire</label>
            <select 
              x-model="selectedAnnee" 
              @change="fetchVacances()"
              class="w-full px-4 py-2 rounded-lg bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <template x-for="annee in anneeScolaires" :key="annee">
                <option x-text="annee" :value="annee"></option>
              </template>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div x-show="loading" class="flex justify-center py-12">
        <div class="inline-flex items-center px-4 py-2 space-x-3">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
        </div>
      </div>

      <!-- Error Message -->
      <div x-show="error" 
           class="bg-red-900/50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-400" x-text="error"></p>
          </div>
        </div>
      </div>

      <!-- Calendrier des Vacances -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template x-for="periode in filteredVacances" :key="periode.id">
          <div class="bg-gray-900 rounded-xl overflow-hidden group hover:ring-2 hover:ring-gray-700 transition-all duration-300">
            <!-- En-tête de la carte avec dégradé selon la zone -->
            <div class="h-2" :class="{
              'bg-gradient-to-r from-zone-a to-zone-a/60': periode.zone === 'Zone A',
              'bg-gradient-to-r from-zone-b to-zone-b/60': periode.zone === 'Zone B',
              'bg-gradient-to-r from-zone-c to-zone-c/60': periode.zone === 'Zone C'
            }"></div>
            
            <div class="p-6">
              <!-- En-tête avec titre et tag de zone -->
              <div class="flex items-start justify-between mb-4 gap-4">
                <h2 class="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors duration-300 flex-1" 
                    x-text="periode.nom">
                </h2>
                <div :class="{
                  'bg-zone-a/10 text-zone-a border-zone-a/30': periode.zone === 'Zone A',
                  'bg-zone-b/10 text-zone-b border-zone-b/30': periode.zone === 'Zone B',
                  'bg-zone-c/10 text-zone-c border-zone-c/30': periode.zone === 'Zone C'
                }" 
                class="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                  <span class="w-2 h-2 rounded-full" :class="{
                    'bg-zone-a': periode.zone === 'Zone A',
                    'bg-zone-b': periode.zone === 'Zone B',
                    'bg-zone-c': periode.zone === 'Zone C'
                  }"></span>
                  <span x-text="periode.zone"></span>
                </div>
              </div>
              
              <!-- Informations de dates et localisation -->
              <div class="space-y-3">
                <div class="flex items-center text-gray-300 text-sm">
                  <svg class="w-4 h-4 mr-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div class="font-medium text-white" x-text="periode.debut"></div>
                    <div class="text-gray-500">au</div>
                    <div class="font-medium text-white" x-text="periode.fin"></div>
                  </div>
                </div>
                
                <div class="flex items-center text-gray-400 text-sm pt-2 border-t border-gray-800">
                  <svg class="w-3.5 h-3.5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span class="line-clamp-1" x-text="periode.location"></span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
`

Alpine.start()
