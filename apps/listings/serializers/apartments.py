"""
Serializers for Apartment listings including creation, updates, and detailed retrieval.
"""

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers

from apps.listings.models import Apartment

from apps.listings.serializers.images import ApartmentImageSerializer


class ApartmentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer used for creating and updating (PUT/PATCH) Apartment listings.
    Delegates core business validation to the model's clean() method.
    """

    class Meta:
        model = Apartment
        fields = (
            "id",
            "title",
            "description",
            "price",
            "address_city",
            "address_district",
            "latitude",
            "longitude",
            "rooms",
            "property_type",
            "is_active",
        )
        read_only_fields = ("id",)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Runs model-level full_clean() validation for both POST and PUT/PATCH requests.
        """

        request = self.context.get("request")
        user = request.user if request else None

        if self.instance:
            # UPDATE (PUT/PATCH)
            instance = Apartment(
                pk=self.instance.pk,
                user=self.instance.user,
                title=attrs.get("title", self.instance.title),
                description=attrs.get("description", self.instance.description),
                price=attrs.get("price", self.instance.price),
                address_city=attrs.get("address_city", self.instance.address_city),
                address_district=attrs.get(
                    "address_district",
                    self.instance.address_district,
                ),
                latitude=attrs.get(
                    "latitude",
                    self.instance.latitude,
                ),
                longitude=attrs.get(
                    "longitude",
                    self.instance.longitude,
                ),
                rooms=attrs.get("rooms", self.instance.rooms),
                property_type=attrs.get(
                    "property_type",
                    self.instance.property_type,
                ),
                is_active=attrs.get(
                    "is_active",
                    self.instance.is_active,
                ),
            )
        else:
            # CREATE (POST)
            instance = Apartment(user=user, **attrs)

        try:
            instance.full_clean(validate_unique=False)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

        return attrs


class ApartmentSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving detailed information about an Apartment listing.
    """

    user = serializers.StringRelatedField(
        read_only=True,
        help_text="User who owns the listing.",
    )

    images = ApartmentImageSerializer(
        many=True,
        read_only=True,
        help_text="List of attached apartment images.",
    )

    average_rating = serializers.DecimalField(
        max_digits=3,
        decimal_places=2,
        read_only=True,
        help_text="Average rating of the listing from 0.00 to 5.00.",
    )

    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Apartment
        fields = (
            "id",
            "title",
            "description",
            "price",
            "address_city",
            "address_district",
            "latitude",
            "longitude",
            "rooms",
            "property_type",
            "is_active",
            "views_count",
            "main_image",
            "average_rating",
            "user",
            "images",
            "created_at",
        )
        read_only_fields = (
            "id",
            "user",
            "views_count",
            "average_rating",
            "created_at",
        )

    def get_main_image(self, obj):
        main_img = obj.images.filter(is_main=True).first()

        if not main_img:
            main_img = obj.images.first()

        if main_img and main_img.image:
            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(main_img.image.url)

            return main_img.image.url

        return None