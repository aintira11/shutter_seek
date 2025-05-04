export interface DataMembers {
    user_id:        number;
    first_name:     string;
    last_name:      string;
    username:       string;
    email:          string; 
    password:       string;
    phone:          string;
    address:        null;
    lineID:         null;
    facebook:       null;
    province:       null;
    image_profile:  string;
    description:    null;
    date_of_member: Date;
    type_user:      string;
    sht_status:     number;
}
export interface DataTegs {
    tags_id:   number;
    name_tags: string;
}

export interface DataPortfolio {
    user_id:       number;
    first_name:    null | string;
    last_name:     null | string;
    username:      null | string;
    email:         string;
    address:       null | string;
    lineID:        null | string;
    facebook:      null | string;
    province:      null | string;
    image_profile: string;
    description:   null | string;
    portfolio_id:  number | null;
    name_work:     null | string;
    tags_id:       number | null;
    name_tags:     null | string;
    image_urls:    string[];
}

export interface DataSreach {
    user_id:       number;
    first_name:    string;
    last_name:     string;
    username:      string;
    email:         string;
    address:       string;
    lineID:        string;
    phone:         string;
    province:      string;
    image_profile: string;
    description:   string;
    portfolio_id:  number;
    name_work:     string;
    tags_id:       number;
    name_tags:     string;
    price:         number;
    image_urls:    string[];
}

export interface DataLike {
    user_id:       number;
    email:         string;
    image_profile: string;
    portfolio_id:  number;
    name_work:     string;
    tags_id:       number;
    name_tags:     string;
    image_urls:    string[];
    date_likes:    Date;
}

//หน้า user 
export interface DataFollow {
    user_id:       number;
    email:         string;
    image_profile: string;
    username:      string;
    follow_id:     number;
    follower_id:   number;
    followed_id:   number;
    date_follow:   Date;
}

export interface Datapackages {
    package_id:   number;
    user_id:      number;
    name_package: string;
    portfolio_id: number;
    detail:       string;
    price:        number;
    tags_id:      number;
    name_tags:    string;
}

export interface Datawork {
    portfolio_id: number;
    name_work:    string;
    tags_id:      number;
    name_tags:    string;
    image_urls:   string[];
}

export interface DataFollower {
    follow_id:   number;
    follower_id: number;
    followed_id: number;
    date_follow: Date;
}

export interface DataReview {
    review_id:     number;
    reviewer_id:   number;
    reviewed_id:   number;
    comment:       string;
    rating:        number;
    date_review:   Date;
    reviewer_name: string;
    profile:       string;
}

export interface DataTopten {
    user_id:        number;
    first_name:     string;
    last_name:      string;
    username:       string;
    email:          string;
    address:        string;
    lineID:         string;
    facebook:       string;
    province:       string;
    image_profile:  string;
    description:    string;
    portfolio_id:   number;
    name_work:      string;
    tags_id:        number;
    name_tags:      string;
    image_urls:     string[];
    follower_count: number;
}

export interface DataShowWork {
    portfolio_id: number;
    name_work:    string;
    tags_id:      number;
    name_tags:    string;
    image_urls:   string[];
    like_count:   number;
    packages:     Package[];
}

export interface Package {
    package_id:   number;
    name_package: string;
    detail:       string;
    price:        number;
}

export interface DataTypeforPacke {
    portfolio_id: number;
    user_id:      number;
    tags_id:      number;
    name_work:    string;
}

export interface DataWorkforEdit {
    portfolio_id: number;
    name_work:    string;
    tags_id:      number;
    name_tags:    string;
    image_urls:   string[];
}