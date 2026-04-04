package com.kamyaabi.validation;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class IndianAddressValidator {

    private static final Map<String, List<String>> STATE_CITIES = new LinkedHashMap<>();

    static {
        STATE_CITIES.put("Andhra Pradesh", List.of("Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Chittoor", "Machilipatnam", "Srikakulam"));
        STATE_CITIES.put("Arunachal Pradesh", List.of("Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Aalo", "Tezu", "Roing", "Namsai"));
        STATE_CITIES.put("Assam", List.of("Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "North Lakhimpur"));
        STATE_CITIES.put("Bihar", List.of("Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chapra", "Sasaram", "Hajipur", "Samastipur"));
        STATE_CITIES.put("Chhattisgarh", List.of("Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari"));
        STATE_CITIES.put("Goa", List.of("Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"));
        STATE_CITIES.put("Gujarat", List.of("Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Mehsana", "Bharuch", "Vapi", "Gandhidham"));
        STATE_CITIES.put("Haryana", List.of("Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar"));
        STATE_CITIES.put("Himachal Pradesh", List.of("Shimla", "Dharamshala", "Mandi", "Solan", "Nahan", "Bilaspur", "Hamirpur", "Kullu", "Chamba", "Una", "Palampur", "Manali"));
        STATE_CITIES.put("Jharkhand", List.of("Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Ramgarh", "Phusro", "Medininagar"));
        STATE_CITIES.put("Karnataka", List.of("Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Udupi", "Hassan"));
        STATE_CITIES.put("Kerala", List.of("Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram", "Pathanamthitta", "Idukki", "Kasaragod", "Wayanad"));
        STATE_CITIES.put("Madhya Pradesh", List.of("Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Morena"));
        STATE_CITIES.put("Maharashtra", List.of("Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai", "Sangli", "Malegaon", "Akola", "Latur", "Nanded"));
        STATE_CITIES.put("Manipur", List.of("Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching", "Senapati", "Ukhrul", "Chandel", "Tamenglong", "Jiribam"));
        STATE_CITIES.put("Meghalaya", List.of("Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara", "Nongpoh", "Mairang", "Khliehriat"));
        STATE_CITIES.put("Mizoram", List.of("Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha", "Lawngtlai", "Mamit", "Hnahthial", "Saitual"));
        STATE_CITIES.put("Nagaland", List.of("Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Longleng", "Peren"));
        STATE_CITIES.put("Odisha", List.of("Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada", "Bhadrak", "Jharsuguda"));
        STATE_CITIES.put("Punjab", List.of("Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar"));
        STATE_CITIES.put("Rajasthan", List.of("Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Sikar", "Sri Ganganagar", "Pali", "Bharatpur", "Tonk", "Kishangarh", "Beawar"));
        STATE_CITIES.put("Sikkim", List.of("Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Singtam", "Jorethang", "Nayabazar", "Ravangla", "Soreng"));
        STATE_CITIES.put("Tamil Nadu", List.of("Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thanjavur", "Dindigul", "Thoothukudi", "Nagercoil", "Hosur", "Kanchipuram"));
        STATE_CITIES.put("Telangana", List.of("Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Siddipet", "Suryapet", "Miryalaguda", "Jagtial", "Mancherial"));
        STATE_CITIES.put("Tripura", List.of("Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Ambassa", "Khowai", "Teliamura", "Sabroom", "Sonamura"));
        STATE_CITIES.put("Uttar Pradesh", List.of("Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj", "Ghaziabad", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Mathura"));
        STATE_CITIES.put("Uttarakhand", List.of("Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Pithoragarh", "Almora", "Kotdwar"));
        STATE_CITIES.put("West Bengal", List.of("Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia"));
        STATE_CITIES.put("Andaman and Nicobar Islands", List.of("Port Blair", "Diglipur", "Rangat", "Mayabunder", "Bamboo Flat", "Prothrapur", "Garacharma", "Car Nicobar"));
        STATE_CITIES.put("Chandigarh", List.of("Chandigarh"));
        STATE_CITIES.put("Dadra and Nagar Haveli and Daman and Diu", List.of("Silvassa", "Daman", "Diu", "Amli", "Naroli"));
        STATE_CITIES.put("Delhi", List.of("New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Karol Bagh", "Lajpat Nagar", "Janakpuri", "Pitampura", "Shahdara"));
        STATE_CITIES.put("Jammu and Kashmir", List.of("Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Pulwama", "Rajouri", "Poonch"));
        STATE_CITIES.put("Ladakh", List.of("Leh", "Kargil", "Diskit", "Padum", "Nyoma"));
        STATE_CITIES.put("Lakshadweep", List.of("Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott"));
        STATE_CITIES.put("Puducherry", List.of("Puducherry", "Karaikal", "Mahe", "Yanam"));
    }

    public boolean isValidState(String state) {
        return STATE_CITIES.containsKey(state);
    }

    public boolean isValidCityForState(String state, String city) {
        List<String> cities = STATE_CITIES.get(state);
        return cities != null && cities.contains(city);
    }

    public List<String> getStates() {
        return new ArrayList<>(STATE_CITIES.keySet());
    }

    public List<String> getCitiesForState(String state) {
        return STATE_CITIES.getOrDefault(state, Collections.emptyList());
    }
}
