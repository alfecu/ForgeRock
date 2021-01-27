/*
 * Copyright 2019 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

package bin.defaults.script

import org.forgerock.json.JsonPointer
import org.forgerock.json.resource.PatchRequest
import org.forgerock.json.resource.UpdateRequest
import org.forgerock.openidm.filter.FilterVisitor
import org.forgerock.services.context.Context

class PropertiesModifiedFilter extends FilterVisitor {
    final List<JsonPointer> propertiesToCheck

    PropertiesModifiedFilter(List<String> propertiesToCheck) {
        this.propertiesToCheck = propertiesToCheck.collect{ JsonPointer.ptr(it) }
    }

    @Override
    Boolean visitUpdateRequest(Context context, UpdateRequest request) {
        return propertiesToCheck.stream()
                .anyMatch{ prop -> request.getContent().get(prop) != null }
    }

    @Override
    Boolean visitPatchRequest(Context context, PatchRequest request) {
        return request.getPatchOperations().stream()
                .map{ op -> op.getField() }
                .anyMatch{ field -> propertiesToCheck.stream()
                    .anyMatch{ prop -> field.equals(prop) || field.isPrefixOf(prop) || prop.isPrefixOf(field) }}
    }
}

final propertiesList = propertiesToCheck as List<String>

final PropertiesModifiedFilter filter = new PropertiesModifiedFilter(propertiesList)
return request.accept(filter, context)